---
emoji: '✋'
title: 'Gatsby 블로그 시작하기'
date: 2025-01-18 13:55:00
update: 2025-03-12 16:00:00
tags:
  - gatsby
series: 'gatsby'
---

## 🧪 테스트 환경

> NodeJS v22.13.0 <br/>
> yarn 1.22.22

## 🛠️ 환경 설정

1. [NodeJS↗](https://nodejs.org/ko/download) 설치
2. yarn 설치
   ```shell
   npm install -g yarn
   ```
3. gatsby-cli 설치
   ```shell
   yarn global add gatsby-cli
   ```
4. Gatsby 블로그 생성

   ```shell
   gatsby new [your-blog-name] [사용하고 싶은 Gatsby 템플릿]

   예시 : gatsby new your-blog-name https://github.com/rundevelrun/gatsby-starter-rundevelrun.git
   ```

## 🚀 개발 환경 구동

아래 과정을 거친 후 `http://localhost:8000`으로 접속

1. 의존성 패키지 설치

   ```shell
   cd your-blog-name
   yarn install
   ```

2. 구동

   구동 방법은 사용하는 Gatsby 템플릿마다 `package.json` 에 작성된 yarn 명령어는 다르겠지만, 대부분 동일하게 `gatsby develop` 명령어를 사용하시면 됩니다.

   **이후 내용부터는 `https://github.com/rundevelrun/gatsby-starter-rundevelrun.git` 템플릿을 기준으로 설명서가 작성되었습니다.**

   ```shell
   yarn develop
   ```

## ☺️ 사용자화

`blog-config.js`의 내용 수정

```javascript
module.exports = {
  title: "YOUR:BLOG:NAME",    // SEO Blog title
  headerTitle: "YOUR:<em style='color:#ed6c02'>BLOG</em>:NAME", // Logo 1
  headerSubTitle: "<em style='color:#ed6c02'>YOUR</em>:BLOG:<em style='color:#ed6c02'>NAME</em>", // Logo 2
  copyright: "©YOUR:BLOG:NAME", // copyright in footer
  author: "YOUR:NAME",  // Your Name
  siteUrl: "https://6developer.com/", // Your Site URL
  description: "Hi, Nice to meet you !",  // Blog description
  links: {
    github: "https://github.com/rundevelrun",
    ...
  },
  giscus: {
    ...
  },
  adsense: {
    ...
  }
}
```

## 📝 게시글 작성

1. `contents/posts` 폴더에 게시글 파일 생성 (두가지 방법)
   1. pathname으로 사용할 이름의 폴더를 만들고 하위에 'index.md'를 생성
   2. pathname으로 사용할 이름으로 `*.md` 파일 생성
2. frontmatter 작성
   ```yaml
   ---
   emoji: '🚀'
   title: '어떻게 시작할까요?'
   date: 2025-01-19 13:53:00
   update: 2025-01-19 13:53:00
   tags:
     - rundevelrun
     - howto
   series: 'Gatsby 블로그 시작하기'
   ---
   ```
