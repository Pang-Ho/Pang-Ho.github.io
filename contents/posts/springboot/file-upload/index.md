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

파일 업로드를 S3를 통해 개발을 하였다.

그러나 사용자들의 AWS S3 접근 망 환경이 좋지 않아, 업로드 속도가 느려졌다.

파일 업로드 속도를 개선해보자.

## 목표

1. Presigned URL 속도 체크
2. Presigned URL multipart로 파일을 쪼개서 업로드
3. 서버를 통한 S3 업로드 속도 체크
4. 서버에 multipart로 파일을 쪼개서 업로드
