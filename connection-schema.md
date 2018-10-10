# Connection Parameter Schema in Generator Object
```json
{
  "connection": {
    "simple-auth": {
      "credential": {
        "client": {
          "id": CLIENT_ID, // client ID
          "secret": CLIENT_SECRET // client secret
          "redirectU
          ri": REDIRECT_URI, // redirect_uri
        },
        "auth": {
          "tokenHost": HOST_URL, // i.e www.example.com
          "tokenPath": HOST_PATH // i.e /auth/login
        },
        "options": { // extra options
          "bodyFormat": "json"
        }
      },
      "authorizarionUri": {
        "redirect_uri": REDIRECT_URI, // redirect_uri
        "scope": "notifications", // scope of authorization
        "state": "3(#0/!~"
      },
      "tokenConfig": {
        "username": USERNAME, // username
        "passeword": PASSWORD // password
      },
      "tokenObject": {
        "access_token": "<Token>",
        "refresh_token": "<Token>",
        "expires_in": "t3600"
      },
      "method": "authorizationCode || ownerPassword || clientCredentials", // check simple-oauth2 NPM Package to choose method
      "tokenFormat": "Bearer {accessToken}",
      "salesforce": true // if you are trying to connect Salesforce ORG
    }
  }
}
```
