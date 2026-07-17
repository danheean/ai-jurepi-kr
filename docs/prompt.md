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

## Backlog