● 학술제 및 졸업논문

● 코드의 양이 방대한 관계로 핵심 기능만 설명하겠음

/api-management/receive
----------------------------------------------------------------------------------------
이 코드의 역할은 분석서버에서 받은 json 데이터를 db에 있는 incidents 테이블에 삽입하는 것임

1. api키 검증 및 api키 상태 확인
   
   ● 요청 Body에서 auth_key를 포함한 여러 필드를 먼저 파싱함.

   ● auth_key가 없으면 바로 400 Missing auth_key로 응답하고 종료함.

   ● api_keys 테이블에서 auth_key로 API 키를 조회하고, id, user_id, status, 그리고 연결된 profiles(email)를 가져옴.

   ● 키가 없거나 조회 에러가 나면 401 Invalid auth_key로 요청을 거부함.

   ● 조회된 API 키의 status가 "active"가 아니면 비활성화된 키로 판단하고 403 API key is inactive. Access denied.로 거부함.

   ● profiles 조인 결과에서 사용자 이메일(userEmail)을 꺼내어 이후 이메일 발송에 사용함.

2. 사용 시간 갱신 및 알림 설정 조회
  
   ● 유효하고 활성화된 API 키인 것이 확인되면, api_keys 테이블의 해당 row에 대해 last_used를 현재 시각(new Date().toISOString())으로 갱신함.

   ● 이어서 notification_settings 테이블에서 user_id 기준으로 email_alert 설정 값을 조회함

   ● 알림 설정이 존재하지 않으면 기본값을 true로 간주하여 emailAlertEnabled를 설정함

3. 신뢰도(confidence) 파싱 및 심각도/상태 계산, incidents 테이블 삽입

   ● confidence 값을 숫자로 변환, detection_result와 parsedConfidence를 사용해 severity와 status를 계산함.

   ● 이후 incidents 테이블에 한 건을 삽입함.

   ● DB 삽입 중 에러가 발생하면 로그를 남기고 500 에러를 반환함.
   
4. 이메일 발송

   ● 먼저 isHighThreat 조건을 계산함. 다음 조건들을 종합적으로 만족하는 경우를 “고위험”으로 봄

   ● 위 조건으로 isHighThreat === true 이고, 2번 단계에서 얻은 emailAlertEnabled가 true인 경우에만 sendImmediateAlertEmail(body, userEmail)을 호출해 해당 유저에게 즉시 이메일 알림을 발송함.

   ● 이메일 발송이 실패하면 에러를 로그로 남기고, 그 에러를 다시 throw 하여 최종 catch에서 처리됨.
----------------------------------------------------------------------------------------

/api-management/ip-threats
----------------------------------------------------------------------------------------
위에 있는 receive와 역할은 비슷하게 json데이터를 threats_ips 테이블에 삽입하는 것임

1. api키 검증 및 api키 상태 확인
   
   ● 요청 헤더에서 auth-key값을 가져옴
   
   ● api_keys 테이블에서 해당 auth_key를 조회하여 id, status를 가져옴
   
   ● 조회된 키의 status가 active가 아니면 요청 거부
   
3. 요청 본문 파싱 및 Threat IP 리스트 유효성 검사

   ● req.json()으로 본문을 파싱해서 total_unique_threat_ips, threat_ip_list를 추출함.
   
   ● threat_ip_list가 배열이 아니거나 비어 있으면 400 Invalid or empty threat_ip_list 응답 후 종료.
   
   ● 유효하다면, 전체 위협 IP 수와 실제 삽입 대상 개수를 로그로 출력함.

4. 위협도 계산 및 threat_ips 테이블용 데이터 매핑

   ● threat_ip_list의 각 항목을 threat_ips 테이블 스키마에 맞춰 변환해서 threatRows 배열을 생성함.
   
      ● api_key_id: 검증된 API 키의 id로 설정 (어떤 키에서 온 위협 IP인지 추적용)
   
      ● ip_address: JSON의 source_ip 값을 그대로 매핑.
   
      ● threat_level: total_hits 기준으로 10,000이 초과하면 high, 2,000 초과하면 "medium", 그 이하인 경우 "low"
   
      ● ai_features: total_hits, last_seen, events를 하나의 JSON 컬럼으로 묶어서 저장.
   
      ● is_blocked: 처음에는 항상 false로 저장.
   
5. Upsert를 통한 DB 저장, 로그 출력 및 응답 반환
   
   ● threat_ips 테이블에 대해 upsert(threatRows, { onConflict: "api_key_id,ip_address" })를 수행함.
   
   ●성공 시에는 각 IP에 대해 ip_address, threat_level, total_hits를 로그로 출력하고, inserted_count를 json 형태로 클라이언트에게 응답

----------------------------------------------------------------------------------------

/api-management/keys
----------------------------------------------------------------------------------------

로그인한 사용자의 api키를 조회하고 , 새로운 api키를 생성, 저장, 반환

1. 로그인한 사용자의 API 키 목록 조회

   ● authorization 헤더를 읽고 없으면 401 Unauthorized 반환.

   ● Supabase 인증으로 사용자 검증

   ● 해당 유저의 api_keys 목록 조회

   ● 조회 결과 반환

2. 새로운 API키 생성

  ● Authorization 헤더로 사용자 인증

  ● 요청 Body 파싱 (이름/설명 입력 받기)

  ● .env 파일에서 SALT 키를 가져옴 (비밀값)

  ● 랜덤값 및 인증키(auth_key) 생성
  
     ● random_value = crypto.randomBytes(32).toString("hex") -> DB에 저장될, 사용자별 고유 랜덤 시드 값.

     ● auth_key = crypto.randomBytes(24).toString("hex") -> 에이전트나 API 클라이언트가 요청 보낼 때 헤더로 사용하는 실제 인증 키.

  ● api_key 계산 (DB에는 저장하지 않음)

  ● DB에 api_keys 행 저장
  
  ● 클라이언트에게 apiKey + authKey 반환

   


