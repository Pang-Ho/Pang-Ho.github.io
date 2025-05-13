---
emoji: '🚀'
title: 'SpringBoot, React, S3 Presigned URL을 이용하여 파일 업로드 속도를 개선해보자'
date: 2025-04-18 00:00:00
update: 2025-04-18 00:00:00
tags:
  - react
  - springboot
series: 'SpringBoot'
---

# 리액트에서 URL 이동시 감지하여 원하는 로직을 넣어보자

## 🧪 테스트 환경

> React v18
> AWS SDK for Java1.x

## 배경

기본적으로 업로드 평균 속도는 5MB/s 라고한다. 대용량까지 풀어주지 않았기 때문에 50MB 안에서만 속도가 잘 나오면 된다.

그래서 파일을 Presigned URL에 통째로 올리는 방식으로 개발해두고 50MB 파일이 약 10초 정도 걸렸지만 대용량 파일을 올리는 사람이 없었기 때문에 문제가 없었었다.

문제가 생겼다. 고객쪽 네트워크 망이 상태가 안좋은지 업로드 속도가 심각하게 느려졌다.

네트워크 쪽에서 처리를 해주겠지만, 우선적으로 시스템 내부에서 개선할 내용을 찾아보자.

## 목표

1. Presigned URL 속도 체크
2. Presigned URL multipart로 파일을 쪼개서 업로드
3. 서버를 통한 S3 업로드 속도 체크
4. 서버에 multipart로 파일을 쪼개서 업로드

## 구현

### 구현하기 앞서 업로드 속도 체크

1. 브라우저에서 S3 직접 파일 전송
   네트워크 망 개선 전 : 50MB / 14분

2. 브라우저에서 파일을 잘라 S3에 직접 파일 전송
   네트워크 망 개선 전 : 50MB / 2분

### 1. Presigned URL multipart 파일 업로드

```javascript
export const FileUploader = forwardRef(props, ref) => {
    const [files, setFiles] = useState<File[]>([]);

    useImperativeHandle(ref, () => ({
      saveFiles: () => onSaveFiles,
    }))

    const onSaveFiles = () => {
      // 1. presigned Url multipart 파일 업로드
      await processUploadMultipartFilesWithPresignedUrl(files);

      ...
    }

    // 1. presigned Url로 파일을 올리는 로직
    async function processUploadMultipartFilesWithPresignedUrl(files: File[]) {
      // 각 part마다 크기 설정 AWS S3는 최소 5MB
      const chunkSize = 10 * 1024 * 1024;
      const partCount = Math.ceil(file.size / chunkSize);

      const uploadPromises = files.map((file) =>
          processUploadMultipartFileWithPresignedUrl(file, chunkSize)
            .then(() => ({ file, status: 'fulfilled' }))
            .catch((error) => ({ file, status: 'rejected', error }))
        );

      const results = await Promise.allSettled(uploadPromises);

      const successFiles: File[] = [];
      const failedFiles: File[] = [];

      results.forEach((result, idx) => {
        const { status, value, reason } = result;

        if (status === 'fulfilled') {
          const res = value;
          if (res.status === 'fulfilled') {
            successFiles.push(res.file);
          } else {
            console.error(`${res.file.name} 업로드 실패`, res.error);
            failedFiles.push(res.file);
          }
        } else {
          console.error(`${files[idx].name} 업로드 중 알 수 없는 실패`, reason);
          failedFiles.push(files[idx]);
        }
      });

      console.log(
        '✅ 성공한 파일:',
        successFiles.map((f) => f.name)
      );
      console.log(
        '❌ 실패한 파일:',
        failedFiles.map((f) => f.name)
      );
    }

    return ...
  }

  const processUploadMultipartFileWithPresignedUrl = async (
      file: File,
      chunkSize: number
    ) => {
      const partCount = Math.ceil(file.size / chunkSize);

      try {
        // 1. preSignedURL List 가져오기
        const FileUploadStartResponse = await axios.get("/api/upload/presigned-url/start", {
          params: {
            fileSize: String(file.size),
            fileName: file.name,
            fileType: file.type,
            partCount: String(partCount),
          },
        })

        const { uploadId, preSignedUrlList, key } = FileUploadStartResponse;
        // const parts: { partNumber: number; eTag: string }[] = [];

        // 2. 각 파트 업로드
        const uploadPart = async (i: number) => {
          const start = i * chunkSize;
          const end = Math.min(file.size, start + chunkSize);
          const blob = file.slice(start, end);

          const res = await axios.put(preSignedUrlList[i], blob, {
            headers: {
              'Content-Type': file.type,
            },
          });

          // 2-1. 파트 업로드시 S3 Response 값으로 eTag 값을 보내주는데, 가지고 있어야한다. eTag값은 preSigneUrl에 multipart file을 업로드하면, response header에 값이 들어옵니다. 이 값을 제대로 받으려면, s3 header cors 설정이 필요합니다.
          const eTag = res.headers.etag || res.headers.ETag || res.headers.Etag;
          return { partNumber: i + 1, eTag: eTag.replace(/"/g, '') };
        };

        // 3. 병렬 업로드
        const uploadPromises = Array.from({ length: partCount }, (_, i) => uploadPart(i));
        const parts = await Promise.all(uploadPromises);

        // 4. 완료요청(완료 요청을 해야 part로 올라간 파일들을 S3내에서 합쳐준다)
        await axios.post("/api/upload/presigned-url/complete", {
          uploadId: uploadId,
          key: key,
          parts: parts,
        });
      } catch (error) {
        console.error(`${file.name} 업로드 실패`, error);
      }
    };
```

```java
  @GetMapping(value = "/api/upload/presigned-url/start")
  public ResponseEntity<FileUploadStartResponse> startMultipartUpload(
          @RequestParam("fileName") @NotBlank String fileName
          , @RequestParam("fileSize") @NotBlank String fileSize
          , @RequestParam("fileType") @NotBlank String fileType
          , @RequestParam("partCount") @NotBlank int partCount
  ) {
      // AWS SDK
      AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withRegion(Regions.AP_NORTHEAST_2)
                    .build();

      // S3에 저장될 키 값(S3 내에서는 파일명으로 봐도 된다.)
      String key = "upload/" + UUID.randomUUID() + "_" + fileName;

      ObjectMetadata metadata = new ObjectMetadata();
      metadata.setContentType(fileType);

      String uploadId = "";
      List<String> preSignedUrls = new ArrayList<>();

      try {
        InitiateMultipartUploadRequest initRequest = new InitiateMultipartUploadRequest([s3 bucket 주소], key)
                .withObjectMetadata(metadata);

        uploadId = s3Client.initiateMultipartUpload(initRequest).getUploadId();

        // Pre-Signed URL 만료 시간 (60분 후)
        Date expiration = new Date();
        long expTimeMillis = expiration.getTime();
        // 10분 후 만료
        expTimeMillis += TimeUnit.MINUTES.toMillis(10);
        expiration.setTime(expTimeMillis);

        // 각 part에 대한 Pre-Signed URL 생성

        for (int i = 0; i < partCount; i++) {
            GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest([s3 bucket 주소], key)
                    .withMethod(HttpMethod.PUT)
                    .withExpiration(expiration)
                    .withContentType(fileType);
            generatePresignedUrlRequest.addRequestParameter("partNumber", String.valueOf(i + 1));
            generatePresignedUrlRequest.addRequestParameter("uploadId", uploadId);

            URL url = s3Client.generatePresignedUrl(generatePresignedUrlRequest);
            preSignedUrls.add(url.toString());
        }

      } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Presigned URL failed for file: " + fileName + ". Error: " + e.getMessage());
      }

      return ResponseEntity.ok(FileUploadStartResponse.builder()
                .uploadId(uploadId)
                .preSignedUrlList(preSignedUrls)
                .key(key)
                .build()
              );
  }


  @PostMapping(value = "/api/upload/presigned-url/complete")
  public ResponseEntity<String> completeMultipartUpload(
          @RequestBody FileUploadCompleteRequest fileUploadCompleteRequest //uploadId, key, parts 세개를 받고있고, parts는 partNumber와 eTag를 받고있습니다.
  ) {
      // AWS SDK
      AmazonS3 s3Client = s3Service.getS3Client();

      try {
        List<PartETag> partETags = fileUploadCompleteRequest.getParts().stream()
              .map(p -> new PartETag(p.getPartNumber(), p.getETag()))
              .collect(Collectors.toList());

        CompleteMultipartUploadRequest completeRequest = new CompleteMultipartUploadRequest(
          [s3 bucket 주소],
                fileUploadCompleteRequest.getKey(),
                fileUploadCompleteRequest.getUploadId(),
                partETags
        );

        s3Client.completeMultipartUpload(completeRequest);

      } catch  (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Compleye failed");
      }

      return new ResponseEntity.ok("완료");
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class FileUploadCompleteRequestVO {
          @Schema(description = "uploadId", name="uploadId")
          private String uploadId;

          @Schema(description = "fileSavePath", name="fileSavePath")
          private String fileSavePath;

          @Schema(description = "parts", name="parts")
          private List<UploadedPartVO> parts;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class UploadedPartVO {
          @NotBlank
          @Schema(description = "partNumber", name="partNumber")
          private int partNumber;

          @JsonProperty("eTag")
          @Schema(description = "eTag", name="eTag")
          private String eTag;
  }
```

> 질문
> Q1. Presigned URL API가 왜 두 개 인가요?
> A1. '/api/upload/presigned-url/start' start api에서는 presigned-url을 프론트로 보내는 역할을 하고, '/api/upload/presigned-url/complete' complete api에서는 presigned url에 올린 multipart 파일이 모두 올라간 경우 하나의 파일로 합치는 과정을 진행합니다.
> Q2. uploadId, partNumber, etag 얘네들은 뭐죠??
> A2.
> Q3. eTag가 undefined 오류가 떠요!!!
> A3. multipart file을 업로드시 S3쪽에서 response header에 eTag값을 줍니다. 이 경우 제대로 받으려면 S3 CORS 설정을 해야합니다. AWS 웹 콘솔에 들어가서 권한 탭을 들어가 CORS를 수정하는 부분이 있는데, 기본적으로 "AllowedHeaders": [ "*" ], .... 등이 들어가 있을거예요. 이곳에서 편집을 이용해 "ExposeHeaders": ["ETag"] 내용을 넣어주면 됩니다.
> Q4. VO 안에 eTag 위에 있는 JsonProperty 어노테이션은 무엇인가요?
> A4. 자바 빈 규칙으로 인해, 두번 째 글자가 대문자로 오는 경우 제대로 인식하지 못합니다. 그래서 etag로 데이터가 들어온것으로 판단해, 프론트에서 eTag로 데이터를 보낸다해도, 서버에서는 인식하지 못합니다. 그래서 eTag라는 '이름의 데이터다!' 라고 표현하는 어노테이션입니다.

### 2. 서버에 스트리밍 방식으로 multipartFile 올리는 로직

```javascript
export const FileUploader = forwardRef(props, ref) => {
    const [files, setFiles] = useState<File[]>([]);

    useImperativeHandle(ref, () => ({
      saveFiles: () => onSaveFiles,
    }))

    const onSaveFiles = () => {
      // 2. 서버에 스트리밍 방식으로 multipartFile 올리는 로직

      // 각 part마다 크기 설정 AWS S3는 최소 5MB
      const chunkSize = 10 * 1024 * 1024;

      for (const file of files) {
        await processUploadMultipartFileWithStreaming(file, chunkSize);
      }

      ...
    }

    // 2. 서버에 스트리밍 방식으로 multipartFile 올리는 로직
    async function processUploadMultipartFileWithStreaming(file: File, chunkSize: number) {
      // 각 part마다 크기 설정 AWS S3는 최소 5MB
      const partCount = Math.ceil(file.size / chunkSize);
      let uploadedSize = 0;

      // 1. 서버에 uploadId 요청
      const { uploadId, key } = await axios.get("/api/upload/server/start", {
        params: {
          fileName: file.name,
          fileType: file.type
        },
      });

      const uploadedParts: { partNumber: number; eTag: string }[] = [];

      // chunk 파일 업로드 로직
      const uploadChunk = async (i: number) => {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('key', key);
        formData.append('chunk', blob);
        formData.append('partNumber', String(i + 1));

        const res = await axios.post("/api/upload/server/start", formData, {
          headers: {
            "Content-Type": "multipart/form-data", // 생략해도 브라우저가 알아서 넣음
          },
        });

        uploadedParts[i] = res; // partNumber, eTag
      };

      await asyncPool(
        10,
        Array.from({ length: partCount }, (_, i) => i),
        uploadChunk
      );

      // 4. 완료요청
      await await axios.post("/api/upload/server/complete", {
          uploadId: uploadId,
          key: key,
          parts: uploadedParts,
          fileSize: String(file.size)
        }
      );
    }

    // 브라우저에서 요청하는 api 호출 개수 조절
    async function asyncPool<T, R>(
      poolLimit: number,
      array: T[],
      iteratorFn: (item: T, index: number) => Promise<R>
    ): Promise<R[]> {
      const ret: R[] = [];
      const executing: Promise<any>[] = [];

      for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const p = Promise.resolve().then(() => iteratorFn(item, i));

        ret.push(p as any); // 결과 배열에 추가

        // poolLimit 이하로만 실행
        if (poolLimit <= array.length) {
          const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
          executing.push(e);
          if (executing.length >= poolLimit) {
            await Promise.race(executing); // 제일 먼저 끝난 작업 기다림
          }
        }
      }

      return Promise.all(ret); // 전체 완료 대기
    }

    return ...
  }



```

```java
  @GetMapping(value = "/api/upload/server/start")
  public ResponseEntity<FileUploadStartResponse> startMultipartUploadWithStreaming(
          @RequestParam("fileName") @NotBlank String fileName
          , @RequestParam("fileType") @NotBlank String fileType
  ) {
      // AWS SDK
      AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withRegion(Regions.AP_NORTHEAST_2)
                    .build();

      // S3에 저장될 키 값(S3 내에서는 파일명으로 봐도 된다.)
      String key = "upload/" + UUID.randomUUID() + "_" + fileName;

      ObjectMetadata metadata = new ObjectMetadata();
      metadata.setContentType(fileType);

      String uploadId = "";

      try {
        InitiateMultipartUploadRequest initRequest = new InitiateMultipartUploadRequest([s3 bucket 주소], key)
                .withObjectMetadata(metadata);

        uploadId = s3Client.initiateMultipartUpload(initRequest).getUploadId();
      } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Presigned URL failed for file: " + fileName + ". Error: " + e.getMessage());
      }

      return ResponseEntity.ok(FileUploadStartResponse.builder()
                .uploadId(uploadId)
                .key(key)
                .build()
              );
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class UploadedPartVO {
          @NotBlank
          @Schema(description = "partNumber", name="partNumber")
          private int partNumber;

          @JsonProperty("eTag")
          private String eTag;
  }


  @PostMapping(value = "/api/upload/server/start", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UploadedPart> uploadMultipartFilesWithStreaming(
            @RequestParam(name = "chunk") MultipartFile chunk,
            @RequestParam(name = "key") String key,
            @RequestParam(name = "uploadId") String uploadId,
            @RequestParam(name = "partNumber") int partNumber
    ) throws IOException {

        // AWS SDK
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                      .withRegion(Regions.AP_NORTHEAST_2)
                      .build();
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(chunk.getSize());
        metadata.setContentType(chunk.getContentType());

        UploadPartRequest partRequest = new UploadPartRequest()
                .withBucketName([s3 bucket 주소])
                .withKey(key)
                .withUploadId(uploadId)
                .withPartNumber(partNumber)
                .withInputStream(chunk.getInputStream())
                .withPartSize(chunk.getSize());

        UploadPartResult partResult = s3Client.uploadPart(partRequest);

        return ResponseEntity.ok(UploadedPartVO.builder()
                .eTag(partResult.getETag())
                .partNumber(partNumber)
                .build()
              );
  }

  @PostMapping(value = "/api/upload/server/complete")
  public ResponseEntity<String> completeMultipartUpload(
          @RequestBody FileUploadCompleteRequest fileUploadCompleteRequest //uploadId, key, parts 세개를 받고있고, parts는 partNumber와 eTag를 받고있습니다.
  ) {
      // AWS SDK
      AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withRegion(Regions.AP_NORTHEAST_2)
                    .build();

      try {
        List<PartETag> partETags = fileUploadCompleteRequest.getParts().stream()
                .map(p -> new PartETag(p.getPartNumber(), p.getETag()))
                .toList();

        CompleteMultipartUploadRequest completeRequest = new CompleteMultipartUploadRequest(
                [s3 bucket 주소],
                fileUploadCompleteRequest.getKey(),
                fileUploadCompleteRequest.getUploadId(),
                partETags
        );

        s3Client.completeMultipartUpload(completeRequest);
      } catch  (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Complete failed");
      }

      return new ResponseEntity.ok("완료");
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class FileUploadCompleteRequestVO {
          @Schema(description = "uploadId", name="uploadId")
          private String uploadId;

          @Schema(description = "fileSavePath", name="fileSavePath")
          private String fileSavePath;

          @Schema(description = "parts", name="parts")
          private List<UploadedPartVO> parts;
  }

```

### 구현 후 업로드 속도 체크

1. 브라우저에서 S3 직접 파일 전송
   네트워크 망 개선 전 : 50MB / 14분

2. 브라우저에서 파일을 잘라 S3에 직접 파일 전송
   네트워크 망 개선 전 : 50MB / 2분

3. 서버에 파일을 올려서 S3에 업로드
   50MB / 18초
   100MB / 30초

4. 서버에 파일을 잘라 올려 S3에 업로드
   50MB / 18초
   100MB / 38초

결과

1. 네트워크 망이 좋지 않은 경우 서버에 파일을 올리는게 획기적으로 빨랐다. 왜지...?
2. 서버에 multipart file을 업로드해서 S3에 업로드 하는 경우는 더 느리다.

### 이후 네트워크 망 속도 개선 된 후 업로드 속도

1. 브라우저에서 S3 직접 파일 전송
   네트워크 망 개선 후 : 50MB / 14초, 100MB / 30초

2. 브라우저에서 파일을 잘라 S3에 직접 파일 전송
   네트워크 망 개선 후 : 50MB / 4초, 100MB / 6초

3. 서버에 파일을 올려서 S3에 업로드
   50MB / 10초
   100MB / 17초

4. 서버에 파일을 잘라 올려 S3에 업로드
   50MB / 10초
   100MB / 18초

결과

1. 속도가 전체적으로 개선 되었다. 내 예상보다는 느리다고 생각되지만, 네트워크 속도가 개선되니 확실히 presigne url이 빨랐다.

## 회고

1. 네트워크 망이 안좋았는데 왜 서버로 파일을 올리는건 빨랐을까?

   프론트 서버와 백엔드 서버 둘다 AWS에 있다.

   클라이언트 => 무수히 많은 방화벽 => 백엔드

   아마 내 예상으로 네트워크 이슈가 AWS 서버까지가 아니고 AWS S3 서버까지에서 이슈가 있었던 것으로 판단된다. 그래서 클라이언트에 AWS 서버로 파일이 올라가는건 정상적인 속도가 나왔고, AWS 서버와 S3 서버 끼리도 속도가 빨랐던것 같다.

2. 프론트와 서버가 모두 AWS에 있는 상태지만, 클라이언트에서 서버로 파일을 올리기 때문에 서버에 파일을 올리는건 느릴거라 판단했으나, 파일을 업로드하는건 이상하게 빨라졌다. 그러나, 서버에 올리는것이 속도가 아직도 느린편이라... 파일 크기를 제한해서 한동안은 작은 크기의 파일만 올리도록 하였다.
