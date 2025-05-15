---
emoji: '🚀'
title: 'SpringBoot, React, S3 Presigned URL을 이용하여 파일 업로드를 해보자'
date: 2025-04-18 00:00:00
update: 2025-04-18 00:00:00
tags:
  - react
  - springboot
  - presigned url
series: 'File Upload'
---

# 리액트에서 URL 이동시 감지하여 원하는 로직을 넣어보자

## 🧪 테스트 환경

> React v18
>
> AWS SDK for Java1.x

## 배경

파일 저장소가 변경되어 S3에 파일 업로드를 구축하려한다.

## 목표

내부 스토리지에 파일 업로드 하는 경우 프론트에서 백엔드로 파일을 업로드한다.

보통 보안을 위해 클라이언트에서 스토리지 접근을 막거나, 서버 안에 파일을 적재하는 경우가 있기 때문이다.

그래서 프론트에서 백엔드로 파일을 스트리밍 형식으로 업로드하고 S3에 업로드 하는 방법과 AWS S3를 사용하기 때문에 서버를 거치지 않고 Presigned URL을 이용하여 AWS S3에 파일을 올리려 한다.

1. 프론트에서 스트리밍 형식으로 백엔드로 파일을 S3에 업로드하는 방법

   자바에서 파일을 다루는 경우 파일 자체가 메모리에 올라가기 때문에 OOM을 일으킬 수 있다.
   그래서 스트리밍 방식을 통해 메모리 부담 없이 파일을 올려보도록 하자

2. 프론트에서 AWS S3 Presigned URL을 이용하여 파일을 업로드하는 방법

## 구현

### 1. 프론트에서 스트리밍 형식으로 백엔드로 파일을 S3에 업로드하는 방법

```javascript
  export const FileUploader = forwardRef(props, ref) => {
    const [files, setFiles] = useState<File[]>([]);

    useImperativeHandle(ref, () => ({
      saveFiles: () => onSaveFiles,
    }))

    const onSaveFiles = () => {
      // 1. 서버에 스트리밍 방식으로 file을 올리는 로직
      await processUploadFilesWithStreaming(files);
    }

    // 1. 서버에 스트리밍 방식으로 file을 올리는 로직
    async function processUploadFilesWithStreaming(newFiles: File[]) {
      const formData = new FormData();
      Array.from(newFiles).forEach((file) => {
        formData.append('files', file); // files는 서버에서 List<MultipartFile>로 받음
      });

      await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // 생략해도 브라우저가 알아서 넣음
        },
      });
    }

    return ...
  }
```

```java
  @PostMapping("/api/upload/server")
  public ResponseEntity<?> uploadFilesS3(@RequestParam("files") MultipartFile[] files) {
    for (MultipartFile file : files) {
      try {
        // S3에 저장될 키 값(S3 내에서는 파일명으로 봐도 된다.)
        String key = "upload/" + UUID.randomUUID() + "_" + file.getOriginalFileName();

        // file.getInputStream()으로 접근시 메모리에 올리지 않고 스트리밍 형식으로 동작
        // 만약 byte[], file.transferTo() 같은 경우는 Heap에 올려서 버퍼링하기 때문에 지양해야함.
        InputStream inputStream = file.getInputStream();
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());


        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withRegion(Regions.AP_NORTHEAST_2)
                    .build();

        // S3에 MultiFile을 올리는 함수
        s3Client.putObject(new PutObjectRequest([s3 bucket 주소], key, inputStream, metadata));

      } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Upload failed for file: " + file.getOriginalFilename());
      }
    }

    return ResponseEntity.ok("업로드 성공");
  }
```

> 질문
> Q1. 스트리밍 방식이 무엇인가요?
>
> A1. 데이터를 한 번에 처리하지 않고, 일정 단위로 끊어서 순차적으로 처리하는 방식. EKS 같은 메모리를 적게 할당하는 시스템인 경우 파일을 처리할 때 스트리밍 방식을 이용하지 않는다면, 파일 객체를 메모리를 그대로 담기 때문에 OOM이 일어날 수 있음.
>
> Q2. POST로 body에 담아 보냈는데 스프링 부트에서는 @RequestParam으로 받나요? @RequestBody가 아닌가요?
>
> A2. 프론트에서 FormData를 보내는 경우, FormData는 브라우저에서 Content-Type을 기본적으로 multipart/form-data형식으로 보내기 때문에, 스프링은 @RequestParam으로 받아야 함. 즉, Content-Type 때문이다.

### 2. Presigned Url로 파일을 올리는 방법

```javascript
  export const FileUploader = forwardRef(props, ref) => {
    const [files, setFiles] = useState<File[]>([]);

    useImperativeHandle(ref, () => ({
      saveFiles: () => onSaveFiles,
    }))

    const onSaveFiles = () => {
      // 2. presigned Url로 파일을 올리는 로직
      await processUploadFilesWithPresignedUrl(files);
    }

    // 2. presigned Url로 파일을 올리는 로직
    async function processUploadFilesWithPresignedUrl(newFiles: File[]) {
      const fileSizeArr: number[] = [];
      const fileNameArr: String[] = [];
      const fileTypeArr: String[] = [];

      Array.from(newFiles).forEach((file) => {
        fileSizeArr.push(file.size);
        fileNameArr.push(file.name);
        fileTypeArr.push(file.type);
      })

      // Presigned URL을 파일 정보들을 보내서 서버에서 가져옴
      const preSignedUrlResponse = await axios.get("/api/upload/presigned-url", {
        params: {
          fileSizeList: fileSizeArr,
          fileNameList: fileNameArr,
          fileTypeList: fileTypeArr
        },
      });

      if (preSignedUrlResponse) {
        // PreSigned URL가지고 각 파일 업로드
        for (const idx in preSignedUrlResponse) {
          await axios.put(preSignedUrlResponse[idx].preSignedUrl, newFiles[idx], {
            headers: {
              'Content-Type': newFiles[idx].type,
            },
          });
        }
      }
    }

    return ...
  }
```

```java
  @PostMapping("/api/upload/presigned-url")
  public ResponseEntity<List<String>> getPresignedUrl (
    @RequestParam("fileSizeList") List<int> fileSizeList,
    @RequestParam("fileNameList") List<String> fileNameList,
    @RequestParam("fileTypeList") List<String> fileTypeList
  ) {
    List<Strng> presginedUrlList = new ArrayList<>();

    for (int i = 0; i < fileNameList.size(); i++) {
      try {
        int fileSize = fileSizeList.get(i);
        String fileType = fileTypeList.get(i);

        // S3에 저장될 키 값(S3 내에서는 파일명으로 봐도 된다.)
        String key = "upload/" + UUID.randomUUID() + "_" + fileNameList.get(i);

        // AWS SDK
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                      .withRegion(Regions.AP_NORTHEAST_2)
                      .build();

        // Pre-Signed URL 만료 시간 (60분 후)
        Date expiration = new Date();
        long expTimeMillis = expiration.getTime();
        // 10분 후 만료
        expTimeMillis += TimeUnit.MINUTES.toMillis(10);
        expiration.setTime(expTimeMillis);

        // PUT Pre-Signed URL (PUT)
        GeneratePresignedUrlRequest generatePresignedUrlRequest =
                new GeneratePresignedUrlRequest([s3 bucket 주소], key)
                        .withMethod(HttpMethod.PUT)
                        .withContentType(fileType)
                        .withExpiration(expiration);

        URL url = s3Client.generatePresignedUrl(generatePresignedUrlRequest);
        presginedUrlList.add(url.toString());

      } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Presigned URL failed for file: " + fileNameList.get(i) + ". Error: " + e.getMessage());
      }
    }

    return ResponseEntity.ok(presginedUrlList);
  }
```

> 질문
> Q1. Presigned URL을 왜 사용하나요?
>
> A1. 서버에 파일을 올리지 않고 S3에 직접 파일을 올릴 수 있어, 서버 부담을 현저히 줄힐 수 있음
>
> Q2. 보안에는 안좋지 않을까요?
>
> A2. 물론 Presigned URL이 유출되면 좋진 않지만, HTTPS로 URL을 받아 사용하고, 유효기간을 설정하여서 쓰기 때문에 적절하게 쓰면 괜찮다. 물론 CORS 설정으로 원하는 URL에서만 들어오게 하면 보안 설정할 수 있다.

## 결과

간단한 형태의 서버 업로드와 Presigned URL 업로드를 해봤다. AWS S3를 사용하는 경우 간단한 방식으로 서버에 부담 없게 파일 업로드를 구현할 수 있다.

## 고촬

파일 업로드를 서버가 맡지 않고, 클라이언트에게 맡기는 것이기 때문에, AWS S3가 클라이언트에서 접근이 되어야 한다는점.

AWS S3 접근이 어렵거나, AWS 접근 망 속도가 느리면 파일업로드가 느린 일이 생긴다.

실제로 운영하는 시스템에서 생긴 일이기 때문에 다음 글은 파일 업로드 속도 개선 작업에 대해 작성할 것이다.

파일 업로드를 네 가지 방법을 비교해볼 것이다.
