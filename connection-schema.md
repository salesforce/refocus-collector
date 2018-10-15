# Connection Parameter Schema in Generator Object
```json
{
  "connection": {
    "simple_oauth": {
      "credentials": {
        "client": {
          "id": "CLIENT_ID",
          "secret": "CLIENT_SECRET",
          "redirectUri": "REDIRECT_URI"
        },
        "auth": {
          "tokenHost": "HOST_URL",
          "tokenPath": "HOST_PATH"
        },
        "options": {
          "bodyFormat": "json"
        }
      },
      "authorizarionUri": {
        "redirect_uri": "REDIRECT_URI",
        "scope": "notifications",
        "state": "3(#0/!~"
      },
      "tokenConfig": {
        "username": "USERNAME",
        "passeword": "PASSWORD"
      },
      "tokenObject": {
        "access_token": "<Token>",
        "refresh_token": "<Token>",
        "expires_in": "t3600"
      },
      "method": "authorizationCode || ownerPassword || clientCredentials",
      "tokenFormat": "Bearer {accessToken}",
      "salesforce": true
    }
  }
}
```
## Examples
### Argus
```json
{
  "connection": {
    "simple_oauth": {
      "credentials": {
        "client": {
        },
        "auth": {
          "tokenHost": "http://localhost:8000",
          "tokenPath": "/argusws/v2/auth/login"
        },
        "options": {
          "bodyFormat": "json"
        },
      },
      "tokenConfig": {
        "username": "USERNAME",
        "password": "PASSWORD"
      },
      "tokenFormat": "Bearer {accessToken}",
      "method": "ownerPassword"
    }
  }
}
```
For more example [See here](https://github.com/lelylan/simple-oauth2/tree/master/example).

## Important Points
- For more information on all above variables and to choose right method look at [simple-oauth2](https://github.com/lelylan/simple-oauth2) NPM Package
- If you are trying to connect Salesforce ORG use `"salesforce": true` option
