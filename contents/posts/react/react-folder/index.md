---
emoji: '🚀'
title: 'React Folder'
date: 2025-03-11 00:00:00
update: 2025-03-12 16:30:00
tags:
  - react
series: 'React'
---

# 리액트 폴더구조

회사에서 처음 리액트 프로젝트를 시작할 때 가장 이해가 안되던 부분이 폴더구조였다.
당시 `src` 폴더 아래에는 메뉴 단위로 가져갔고, 공통 컴포넌트는 `components` 아래에 파일 단위로만 들어가 있었다.
또한 `public/assets`와 `src/assets`의 차이를 몰랐었다.

중간에 프로젝트를 투입하게 되면서 내가 보는 페이지가 어떤 파일인지 유추가 안되고, 파일을 어디에 둬야할지 고민이 되었다.

다른 사람들은 어떤 폴더구조를 쓸까? 에 대한 내용과 내가 사용하는 폴더 구조를 소개하려고 한다.

> 기본적으로 폴더구조는 프로젝트 상황과 사용하는 라이브러리, 디자인 패턴에 맞게 수정하는게 맞다고 생각한다.

## create-react-app 폴더구조

```
my-app/
├── node_modules/       # 프로젝트에 필요한 모든 의존성이 저장되는 폴더
├── public/             # 정적 파일이 저장되는 폴더
│   ├── favicon.ico     # 브라우저 탭에 표시되는 아이콘
│   ├── index.html      # React 앱이 로드되는 기본 HTML 파일
│   ├── logo192.png     # 기본 제공 로고 이미지 (192x192 크기)
│   ├── logo512.png     # 기본 제공 로고 이미지 (512x512 크기)
│   ├── manifest.json   # PWA 관련 설정 파일
│   ├── robots.txt      # 검색 엔진 크롤러 관련 설정 파일
│   └── ...
├── src/                # 애플리케이션의 주요 소스 코드가 들어가는 폴더
│   ├── App.css         # `App` 컴포넌트의 스타일 정의
│   ├── App.js          # 주요 애플리케이션 컴포넌트
│   ├── App.test.js     # `App` 컴포넌트의 테스트 파일
│   ├── index.css       # 전역 스타일 정의
│   ├── index.js        # 애플리케이션의 진입점 파일
│   ├── logo.svg        # 기본 제공 React 로고 (SVG 형식)
│   ├── reportWebVitals.js # 성능 측정 관련 코드
│   ├── setupTests.js   # 테스트 설정 파일 (Jest)
│   └── ...
├── .gitignore          # Git에서 무시할 파일 목록
├── package.json        # 프로젝트 및 의존성 설정 파일
├── README.md           # 프로젝트 설명 파일
├── yarn.lock / package-lock.json  # 의존성 고정 파일
└── ...
```

- 리액트를 처음 시작할 때 바로 볼 수 있는 폴더구조이다.
  리액트를 처음 하는 사람한테는 src 내부 구조가 없어 폴더를 어떻게 만들지 고민이 된다.

### src 폴더 구체화

```
src/
├── components/       # 재사용 가능한 UI 컴포넌트
├── pages/            # 주요 페이지 구성 요소
├── hooks/            # 사용자 정의 훅
├── services/         # API 호출 및 비즈니스 로직
├── types/            # 타입
├── utils/            # 유틸리티 함수
├── context/          # React Context API 관련 코드
└── assets/           # 이미지, 폰트, 아이콘 등 정적 리소스
```

- Chat GPT는 `src` 구조를 위 처럼 확장하는 것을 추천한다. 페이지 단위로 파일을 만들고, 재사용이 가능한 컴포넌트는 따로 관리하며
  커스텀 훅도 따로 관리한다. 실제로 파일들을 넣어보자

```
src/
├── components/       # 재사용 가능한 UI 컴포넌트
│		└── board-header.tsx
├── pages/            # 주요 페이지 구성 요소
│       └── board-page.tsx
├── hooks/            # 사용자 정의 훅
│		└── use-board.ts
├── services/         # API 호출 및 비즈니스 로직
│		└── board-api.ts
├── types/            # 타입
│		└── board.ts
├── utils/            # 유틸리티 함수
│		└── date-util.ts
├── context/          # React Context API 관련 코드
├── assets/           # 이미지, 폰트, 아이콘 등 정적 리소스
│		└── image1.png
...
```

- 첫 프로젝트 때 이러한 구조가 되었었다. 게시판을 위 처럼 개발했을 때 수정이 필요한 경우
  광범위하게 흩어진 코드를 찾으러 다녀야해서 너무 힘들었다.

> 그래서 생각한 것은
>
> 1. URL 경로와 페이지 컴포넌트는 보통 1 : 1 이니까 경로에 맞게 폴더 구조를 만들기
> 2. 특성이 같고, 수정사항이 많은 파일의 경우는 같은 곳에 넣어두자

## 내가 사용하던 폴더 구조

- 아래 조건들에 맞춰 `pages` 폴더를 좀더 구체화 하였다.
  - 프로젝트 규모가 작다
  - 라우팅 되는 URL 경로 구조와 `pages` 폴더 구조가 같도록 한다
    - 폴더로 라우팅 구조 파악 가능
  - 중요 로직은 커스텀 훅에서 관리한다
    - UI와 로직 분리

```
src/
├── components/                     # 재사용 가능한 UI 컴포넌트
├── pages/                          # 주요 페이지 구성 요소
│       └── board/                  # URL 경로
│            ├── components/        # 종속된 UI 컴포넌트
│            │    ├── hooks/        # 종속된 커스텀 훅
│		         │    │    └── use-board-header.ts
│		         │    │
│		         │    └── board-header.tsx
│            ├── hooks/             # 종속된 커스텀 훅
│		         │    └── use-board.ts
│            ├── schema/            # hook-form 스키마
│		         │    └── board-schema.ts
│            ├── api/               # API 호출
│		         │    └── board-api.ts
│            ├── models/            # 타입
│		         │    └── board.ts
│            └── board-page.tsx
│
├── hooks/            # 전역으로 사용하는 사용자 정의 훅
├── apis/             # 전역으로 사용하는 API 호출
├── models/           # 전역으로 사용하는 타입
├── utils/            # 유틸리티 함수
├── assets/           # 이미지, 폰트, 아이콘 등 정적 리소스
├── routers/          # 라우팅 관련 컴포넌트
├── stores/           # 상태관리 라이브러리 상태
├── App.tsx           # 최상위 컴포넌트
└──
```

`board` 경로에는 이제 한 곳에서 소스를 한 눈에 확인할 수 있고, 관리 포인트도 좁아졌다.
프로젝트를 혼자하는 것도 아니고, 새로 들어오는 개발자에게 폴더 구조를 몇 시간동안 강의할 것이 아니라면
이해가 가는 선에서 구조를 만들어주는 방향은 정말 좋은 것 같다.

또한 커스텀 훅 패턴으로 훅에 로직을 모두 넣어두고 컴포넌트에서 불러오는 방식이 유지보수 방면에서 좋다고 느꼈다.
UI 컴포넌트에서 UI 소스 부분에 서비스 로직이 들어있는 경우 소스 보기가 불편한 경우가 많았다..

## 유명한 FSD

위 구조를 보면 `게시판`이라는 특징을 가진 기능을 `board` 폴더로 묶은 모습을 볼 수 있다.
같은 특징을 가진 소스는 한 곳으로 모아두자 라는 느낌으로 묶은 것인데, `feature`와 관련된 유명한 아키텍처 방법론으로 `FSD`가 있다.
물론 내가 사용하던 폴더 구조와는 많이 다르게 생겼다.
`layer`로 둬서 같은 엄격하게 폴더에 들어갈 소스 위치를 구분하고 `feature`에서 기능을 묶는 방법론이다.

![FSD Scheme.png](FSD Scheme.png)

위 사진만으로 이해가 되지않지만, FSD 홈페이지를 가보면, 예제와 마이그레이션 방법도 친절히 나와있다.

[FSD 마이그레이션 방법](https://feature-sliced.design/docs/guides/migration/from-v1) 그 중에 `layer` 내용만 가져와보겠다.

- FSD Layer
  - /app — application initialization layer
    - Previous versions: app, core, init, src/index (and this happens)
  - /processes — business process layer
    - Previous versions: processes, flows, workflows
  - /pages — application page layer
    - Previous versions: pages, screens, views, layouts, components, containers
  - /features — functionality parts layer
    - Previous versions: features, components, containers
  - /entities — business entity layer
    - Previous versions: entities, models, shared
  - /shared — layer of reused infrastructure code 🔥
    - Previous versions: shared, common, lib

여기서 크게 `app / pages / features` 만 봐도 좋다.

```
src/
├── app
│       ├── layout/
│       ├── providers/
│       ├── routers/
│       └── App.tsx
├── pages
│       └── board/
│            └── board-page.tsx
├── features
│       └── board/
│            └── ui/
│		          └── board-header.tsx
├── entities
│       └── board/
│		     └── types.ts
├── shared
│       └── api/
│            └── board/
│		          └── board-api.ts
│       └── assets/
│       └── lib/
└──
```

크게 내용을 넣진 않았지만, `app` > `pages` > `features` > `entities` > `shared` 형식으로 층을 나누어서 자기보다 아래에 있는 층만
참조해서 가져오는 방식이다.
복잡하지만 상당히 큰 프로젝트에는 모든 기능이 나눠져있어 관리하는 부분에선 좋을 것이다.

## MIT 리액트 아키텍처

[MIT 리액트 아키텍처](https://github.com/alan2207/bulletproof-react/)

리액트 아키텍처 구조를 가이드처럼 만들어둔 레포가 있다. `Star 29k` 가 넘어간 유명한 레포며, `feature`를 기준으로 폴더를 설계하였다.
`nextjs 앱`, `nextjs 웹`, `react-vite` 세개의 구조를 보여준다.

> bulletproof 는 안정적인 코드를 뜻한다.

```
src/
├── features
│       └── comments/
│            └── api/
│		         └── components/
└──
```

`feature` 폴더 하나를 기준으로 보면, 내가 사용하는 폴더구조와 비슷하게 한 곳에서 관련된 소스들을 관리한다.
하지만 `FSD`와 비슷하게 `app` 폴더에서 어플리케이션 구조를 만든다. `pages` 폴더 없이 `app`폴더에서 모두 관리한다.

```
src/features/awesome-feature
|
+-- api         # exported API request declarations and api hooks related to a specific feature
|
+-- assets      # assets folder can contain all the static files for a specific feature
|
+-- components  # components scoped to a specific feature
|
+-- hooks       # hooks scoped to a specific feature
|
+-- stores      # state stores for a specific feature
|
+-- types       # typescript types used within the feature
|
+-- utils       # utility functions for a specific feature
```

## 정리

`FSD`, `bulletproof-react repository`를 구경해봤다. `feature` 폴더에 기능 기준으로 컴포넌트를 만들고, 필요한 `api` 호출이나 종속된 컴포넌트의 경우 같은 공간에 만들어 소스 확인할 때 이리저리 움직이지 않게 만드는 모습을 보인다. `feature` 방식을 이용해볼까 생각중이다. 물론 마이그레이션까지 하면서 진행할 생각은 없다.

프로젝트가 진행되면서 공통적으로 만들어야하는 기능이 많아지는 경우 `src/component` 폴더가 매우 커졌던 경험이 있다. 즐겨찾기가 되는 버튼형 아이콘을 만들 때 기능에 치중한 컴포넌트이니까 `src/component/feature` 폴더를 만들거나, `src/component/feature` 폴더를 만들어서 한 곳에 만들고, `src/component/ui` 폴더에는 기능이 없는 컴포넌트는 어떤가 싶기도 하다.

> 운영하는 시스템에서 조금 신경쓰일정도로 느린 화면들이 있는데, `SSR`을 사용하면 조금 나아질까 싶어 Nextjs를 공부하고있다.
>
> 사용하던 폴더구조를 보니 Nextjs의 페이지 라우팅 구조와 비슷한 모습을 보여 놀랐다.
