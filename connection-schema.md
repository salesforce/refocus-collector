# Configuring the Connection in the Sample Generator

For Sample Generators which require authorization for the connection, the use the `connection` attribute of the Sample Generator. The object contents of this attribute are based on [simple-oauth2](https://github.com/lelylan/simple-oauth2). Please refer to their [documentation](https://github.com/lelylan/simple-oauth2) and [examples](https://github.com/lelylan/simple-oauth2/tree/master/example).

Note: If you are connecting to a Salesforce org using Salesforce's REST API, set `"salesforce": true` inside the `simple_oauth` attribute (see below).

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
        "password": "PASSWORD"
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
## Additional Examples

### Argus

If you are connecting to an [Argus](https://github.com/salesforce/Argus) instance, your `connection` object should look like this:

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
