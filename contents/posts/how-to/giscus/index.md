---
emoji: '✋'
title: 'giscus 시작하기'
date: 2025-03-13 13:00:00
update: 2025-03-13 13:00:00
tags:
  - gatsby
series: 'gatsby'
---

## 🧪 테스트 환경

아래 명령어를 통해 `gatsby-starter-rundevelrun` 템플릿을 이용하는 사람의 경우거나 블로그에 댓글을 `github`를 통해 만들고 싶은 경우 참고만 하면 된다.

```shell
gatsby new your-blog-name https://github.com/rundevelrun/gatsby-starter-rundevelrun.git
```

## 🍳 giscus가 무엇인가?

giscus는 `github repository`의 `Discussion`을 통해 댓글 기능을 만들어주는 편리한 라이브러리입니다.

개발자는 `github repository`에서 `Discussion` 기능을 열어두고, giscus 홈페이지에서 `github repository` 주소와 여러 설정을 추가하면 giscus 정보를 받을 수 있습니다.

## ☝ giscus 설정 방법

1. 댓글 데이터를 담아둘 `repository`에 접속한다.
   - `public repository`인지 확인한다.
   - [giscus 설치 페이지](https://github.com/apps/giscus) 접속하여 giscus를 설치한다.
   - `repository settings`로 들어가서 `Features`에 있는 `Discussions` 체크박스에 체크한다.
2. [giscus 홈페이지](https://giscus.app/ko) 접속하여 설정한다.
   - 저장소 명을 입력한다.
   - Discussions 연결 방법을 선택한다.
   - Discuussion 카테고리를 선택한다. (Announcements를 권장합니다.)
   - 원하는 테마와 기능을 설정하고, `giscus script`를 복사한다.
   ```javascript
   //예시
   <script
     src="https://giscus.app/client.js"
     data-repo="[ENTER REPO HERE]"
     data-repo-id="[ENTER REPO ID HERE]"
     data-category="[ENTER CATEGORY NAME HERE]"
     data-category-id="[ENTER CATEGORY ID HERE]"
     data-mapping="pathname"
     data-strict="0"
     data-reactions-enabled="1"
     data-emit-metadata="0"
     data-input-position="bottom"
     data-theme="preferred_color_scheme"
     data-lang="ko"
     crossorigin="anonymous"
     async
   ></script>
   ```

## ✌ 개인 블로그에서 giscus 컴포넌트 만들어서 사용하기

1. giscus 라이브러리 설치

   ```shell
   npm i giscus
   ```

2. 컴포넌트 생성

   `giscus script`에서 받은 데이터를 컴포넌트에 넣어서 사용하면 완성!

   ```javascript
   import Giscus from '@giscus/react';

   export default function MyApp() {
     return (
       <Giscus
         id="comments"
         repo="[ENTER REPO HERE]"
         repoId="[ENTER REPO ID HERE]"
         category="[ENTER CATEGORY NAME HERE]"
         categoryId="[ENTER CATEGORY ID HERE]"
         mapping="pathname"
         term="Welcome to @giscus/react component!"
         reactionsEnabled="1"
         emitMetadata="0"
         inputPosition="bottom"
         theme="light"
         lang="ko"
         loading="lazy"
       />
     );
   }
   ```

   > [giscus Github 주소](https://github.com/giscus/giscus-component) 참고하였습니다.

## ✌ rundevelrun/gatsby-starter-rundevelrun 템플릿 전용 설정

`blog-config.js`의 내용 수정

```javascript
module.exports = {
   ...
   links: {
      ...
   },
   giscus: {
      repo="[ENTER REPO HERE]"
      repoId="[ENTER REPO ID HERE]"
      category="[ENTER CATEGORY NAME HERE]"
      categoryId="[ENTER CATEGORY ID HERE]"
      mapping="pathname"
      strict="0"
      reactionsEnabled: '1',
      inputPosition="bottom"
      lang: 'ko',
   },
   adsense: {
      ...
   }
}
```

## 👍 댓글 창 확인

![giscus 댓글 스크린샷](./images/how-to/giscus-screenshot.png)
