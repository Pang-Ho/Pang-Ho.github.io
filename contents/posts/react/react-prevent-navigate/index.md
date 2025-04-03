---
emoji: '🚀'
title: '리액트에서 뒤로가기, 새로고침, 페이지 이동을 막아보자'
date: 2025-04-02 00:00:00
update: 2025-04-02 00:00:00
tags:
  - react
series: 'React'
---

# 리액트에서 URL 이동시 막기

## 🧪 테스트 환경

> React v18

## 배경

요청사항으로 페이지 내에서 수정이 일어난 경우 URL을 이동하려고 할 시 confirm 창을 띄워 정말 이동하고 싶은건지 물어보는 기능이 필요하다고 한다.

리액트에서 제공해주는 방식이 없기 때문에 기능을 구현하고자 한다.

## 목표

리액트에서 URL을 이동할 수 있는 방법은 `Link 컴포넌트`, `useNavigate`, 뒤로가기, 새로고침, 앞으로가기가 있다.

1. 제어가 안되는 `useNavigate` 훅과 `Link` 컴포넌트를 다른 방식으로 동작하도록 할 것
2. 뒤로가기와 새로고침의 경우 브라우저의 이벤트를 이용하여 막을 것

## 기능 추가

1. 뒤로가기, 새로고침 이벤트 설정

   뒤로가기와 새로고침을 막고자 하는 컴포넌트에 커스텀 훅을 넣어줘서 동작을 제어해보자.

   ```javascript
   //usePreventRefresh.ts
   export const usePreventPageExit = () => {
    const navigate = useNavigate();
    const isModified =
    /* 이곳에는 isModified를 전역으로 관리할 수 있는 방법을 이용한다.
     * 상태값보단 불필요한 렌더링을 일으키지 않는 useRef 객체를 이용는 것을 추천합니다.
     */

    // 새로고침 이벤트 핸들러 함수
    // 새로고침시 이벤트를 막는다면, 브라우저에서 지정해놓은 confirm 창이 뜬다.
    const handleBeforeunload = (event) => {
      if (isModified) {
        event.preventDefault();
        event.returnValue = '';
      }
    }

    // 뒤로가기 이벤트 핸들러 함수
    /* 방식
     * 1. 첫 화면 렌더링시 window의 history 객체에 현재 주소로된 이력을 넣는다.
     * 2. 뒤로가기 클릭시 이전 이력이 현재 주소이기 때문에 브라우저 화면이 다시
          로드되지  않고, 현재 화면에 그대로 있는다.
     * 3. window의 history 객체에 현재 주소로된 이력을 한 번 더 넣는다.
     * 4. 사용자의 yes, no 클릭을 이용해 다음 행동을 결정짓는다.
     * 4-1. yes 클릭
        현재 히스토리에는 3번에서 넣은 이력으로 인해 2번 뒤로가도록 한다.
       4-2. no 클릭
        히스토리에 현재 주소 이력이 있어야하기 때문에 아무일도 일어나지 않는다.
     */
    const handlePopstate = () => {
      if (isModified) {
        history.pushState(null, '', location.href);
        if (confirm('뒤로가시겠습니까? 작성된 내용은 저장이 되지 않습니다.')) {
          navigate(-2);
        }
      } else {
        navigate(-1);
      }
    }

    useEffect(() => {
      // 컴포넌트가 마운트되면 이벤트 생성 및 현재 주소 이력 추가
      window.addEventListener('beforeunload', handleBeforeunload);
      history.pushState(null, '', location.href);
      window.addEventListener('popstate', handlePopstate);

      return () => {
        // 컴포넌트가 언마운트되면 이벤트를 제거한다.
        window.removeEnventListener('beforeunload', handleBeforeunload);
        window.removeEnventListener('popstate', handlePopstate);
      }
    }, [])
   };
   ```

2. `useNavigate` 훅 커스텀

`navigate('???')` 방식으로 리액트에서 페이지 이동을 시킨 경험이 있을 것 입니다. 위 처럼 페이지 이동시에 이벤트를 감지해서 막을 수 있지 않을까? 라는 생각을 했으면 바람직한 생각입니다. 그러나 `navigate` 함수가 실행이 되면, 중간에서 이벤트로 막을수가 없기 때문에 훅을 커스텀해서 사용해야 합니다. 저는 아래와 같이 사용했지만 절대로 정답은 아닙니다.

```javascript
  const useCustomNavigate = () => {
    const navigate = useNavigate();
    const isModified =
    /* 이곳에는 isModified를 전역으로 관리할 수 있는 방법을 이용한다.
     * 상태값보단 불필요한 렌더링을 일으키지 않는 useRef 객체를 이용는 것을 추천합니다.
     */

    const customNavigate = (to: To, options?: NavigateOptions, callback?: () => void) => {
      if (isModified) {
        if (confirm('이동하시겠습니까? 작성된 내용은 저장이 되지 않습니다.')) {
          navigate(to, options);
          isModified = false;
          callback && callback();
        } else {
          navigate(to, options);
          callback && callback();
        }
      }
    }

    return customNavigate;
  }

  export default useCustomNavigate();
```

3. 사용 방법

   ```javascript
    const BoardRegistPage = () => {
      const navigate = useCustomNavigate();
      const isModified =
      /* 이곳에는 isModified를 전역으로 관리할 수 있는 방법을 이용한다.
       * 상태값보단 불필요한 렌더링을 일으키지 않는 useRef 객체를 이용는 것을 추천합니다.
       */

      // 수정이 되었을 때 부터 이동 감지를 하고자 원한다면 이런 방식으로,
      // 컴포넌트가 마운트 되자마자 막고 싶다면, useEffect를 이용
      const handleChange = () => {
        isModified = true;
        ...
      }

      // isModified가 true면, navigate 함수에서 이동을 막는 로직이 실행된다.
      const handleClick = () => {
        navigate('/test');
      }

      return (
        <>
          {/* Link 컴포넌트는 to에 이동하지 않도록 #을 넣어주고, 이동 방식은 onClick을 이용하여 이동을 막도록 한다.*/}
          <Link
            to="#"
            onClick={handleClick}
          >이동</Link>

          ...
        </>
      )
    }
   ```

   4. 전역으로 사용할 변수 `isModified`

   `isModified` 는 전역으로 사용할 변수를 이용한다.

   1. 컴포넌트 밖에서 선언한 let 변수 (권장안함)
   2. 상태관리 라이브러리 (zustand, Redux 등) (상태값으로 선언시 불필요한 리렌더링 유발)
   3. `useRef` 객체 (권장)

   위 내용을 기반으로 `Context` 에 `useRef` 객체로 선언된 `isModified`를 불러와서 사용하자.

   이 경우 불필요한 리렌더링을 안하기 때문에 편리하게 사용할 수 있고, 어디서든 불러와서 사용할 수 있다.
