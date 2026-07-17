## 프롬프트 이력

### 2026. 07. 17.

#### 초기
/project-spec-writer 무료 AI 온라인 도구를 개발해서 제공하는 사이트를 만들고 싶어                                   
- 참고사이트: https://apps.jurepi.kr/ko (AI 기능이 없어)                                                              
- AI 기능이 포함된 사이트를 https://ai.jurepi.kr 로 서비스 할꺼야                                                     
- 도구들은 하나씩 채울꺼야                                                                                            
- 배포는 클라우드플레어를 사용할꺼야                                                                                  
- 도메인은 이미 가지고 있어                                                                                           
- 첫번째 도구는 헤어스타일 추천                                                                                       
- @services/ 아래에 카테고리/도구명/SPEC.md 부터 만들고 시작하자                                                      
- ../Jurepi.kr 을 참고해                          

#### GEMINI_KEY

- GEMINI KYE
- 이름: Gemini API Key
- 프로젝트 이름: projects/641071573090
- 프로젝트 번호: 641071573090
- 키 테스트: 
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent" \
  -H 'Content-Type: application/json' \
  -H 'X-goog-api-key: [ENCRYPTION_KEY]' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```

- 지원 모델 목록 조회 테스트:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models" \
  -H 'Content-Type: application/json' \
  -H 'X-goog-api-key: [ENCRYPTION_KEY]'
```

- 지원하는 주요 모델 및 무료 플랜 사양 (2026. 07. 기준):

| 모델 구분 | 모델명 (API ID) | 무료 플랜 제한 (Rate Limits) | 주요 특징 및 추천 용도 |
| :--- | :--- | :--- | :--- |
| **Gemini 3.5 Flash** | `models/gemini-3.5-flash` | **매우 타이트함**<br>(약 2~5 RPM / 일일 쿼터 제한적) | 최신 세대 최고 성능 모델. 추론/멀티모달 성능이 가장 뛰어나나 사용량 제한으로 잦은 개발 테스트에는 부적합. |
| **Gemini 3.0/3.1 Flash** | `models/gemini-3-flash-preview`<br>`models/gemini-3.1-flash-lite` | **보통 / 여유로움**<br>(약 15 RPM / 1M TPM / 1,500 RPD) | **[개발 추천]** 3.x 세대의 고성능 멀티모달 및 긴 컨텍스트 혜택을 받으며 안정적인 한도로 테스트 가능. |
| **Gemini 2.5 Flash** | `models/gemini-2.5-flash` | **여유로움**<br>(15 RPM / 1M TPM / 1,500 RPD) | 가장 안정적인 Stable 버전. 속도가 매우 빠르고 쿼터가 넉넉하여 개발 및 소규모 서비스 운영에 매우 적합. |
| **Gemini Pro 계열** | `models/gemini-2.5-pro`<br>`models/gemini-3.1-pro-preview` | **매우 타이트함**<br>(2 RPM / 32,000 TPM / 50 RPD) | 복잡한 코딩, 깊은 논리 추론에 특화. 속도가 다소 느리고 무료 플랜 제한이 엄격해 실시간 웹 서비스용으로는 부적합. |
| **Imagen 4 (이미지)** | `models/imagen-4.0-generate-001` | **제한적**<br>(일일 약 100 이미지 내외) | 텍스트를 기반으로 고품질 이미지를 생성하는 작업에 사용. |

> [!NOTE]
> * **데이터 사용 정책**: 무료 플랜(Free Tier)의 경우 입력값 및 결과 데이터가 구글의 서비스 개선 및 모델 학습에 사용될 수 있습니다. 보안이 중요한 데이터는 유료 플랜을 사용해야 합니다.
> * **프로젝트 단위 제한**: 사용량 제한(Rate Limit)은 API Key가 아닌 구글 클라우드/AI Studio 프로젝트 단위로 적용됩니다.

## Backlog