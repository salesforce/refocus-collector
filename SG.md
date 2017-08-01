# Sample Generator

A Sample Generator is a Refocus component which defines how to generate a particular set of samples.

## Attributes

A Sample Generator has following attributes:

- `name` (String, required) - the name of the sample generator.
- `description` (String, required) - a description of the sample generator.
- `keywords` (Array of Strings, optional) - a list of keywords in the form of an array of strings. This should help users who 
are searching for your sample generator.
- `generatorTemplate` (Object, required)
  - `name` (String, required) - the name of the sample generator template to use.
  - `version` (String, required) - the version of the sample generator template to use; accepts comparators, hyphen ranges, 
  x-ranges, tilde ranges and caret ranges. See https://docs.npmjs.com/misc/semver for version grammar.
- `simple-oauth` (Object, required if sample generator template has connection.authorization = `simple-oauth`) - Refer to http://lelylan.github.io/simple-oauth2/#options for details on how to specify the simple-oauth options.
  - `credential` (Object, required) - Credential object which is required to create oauth object using simple-oauth
    - `client` (Onject, required) - Refer https://github.com/lelylan/simple-oauth2) for description
      - `id` (String, optional) - Refer https://github.com/lelylan/simple-oauth2) for description
      - `secret` (String, optional) -  Refer https://github.com/lelylan/simple-oauth2) for description
      - (few more options here refer : https://github.com/lelylan/simple-oauth2)
    - `auth` (Object, required) - Refer https://github.com/lelylan/simple-oauth2) for description
      - `tokenHost` (String, optional) - Refer https://github.com/lelylan/simple-oauth2) for description
      - `tokenPath` (String, optional) - Refer https://github.com/lelylan/simple-oauth2) for description
      - (few more options here refer : https://github.com/lelylan/simple-oauth2)
    - `options` - Refer https://github.com/lelylan/simple-oauth2) for description
      - `bodyFormat` (String, optional) - Refer https://github.com/lelylan/simple-oauth2) for description
      - (few more options here refer : https://github.com/lelylan/simple-oauth2)
    - (few more options here refer : https://github.com/lelylan/simple-oauth2)
  - `authorizarionUri` (Object, optional) - Authorization oauth2 URI
    - `redirect_uri` (String, optional) - Redirect URI Refer https://github.com/lelylan/simple-oauth2) for more information
    - `scope` (String, optional) - Scope for oauth https://github.com/lelylan/simple-oauth2) for more information
    - `state` (String, optional) - State for oauth https://github.com/lelylan/simple-oauth2) for more information
  - `tokenConfig` (Object, optional) - TokenConfig object for getting access token, pass argument depends on your oauth flow. (Refer https://github.com/lelylan/simple-oauth2) for more information)
    - `username` (String, optional) - Username for oauth
    - `password` (String, optional) - Password for oauth
    - `redirect_uri` (String, optional) - Redirect URI for oauth
    - `code` (String, optional) - Code for oauth
  - `tokenObject` (Object, optional) - Token Object for oauth which has refresh token facility
    - `access_token` (String, optional) - Access token which mostly will be null
    - `refresh_token` (String, optional) - Refresh token which mostly will be null
    - `expires_in` (String, optional) - Expires time of access token in second
    (Refer https://github.com/lelylan/simple-oauth2) for more information)
  - `function` (String, required) - Function for getting oauth token using simple-oauth package. Select the value from `authorizationCode` Or `ownerPassword` Or `clientCredentials` depends on your implementation. (Refer https://github.com/lelylan/simple-oauth2) for more information)
- `aspects` (Array of Strings, required) - one or more aspect names.
- `subjects` (Array of Strings, one of either `subjects` or `subjectQuery` is required) - the absolutePath of one
or more subjects.
- `subjectQuery` (Array of Strings, one of either `subjects` or `subjectQuery` is required) - a query which 
defines the set of subjects for which to generate samples. Using a subject query lets you specify your set of 
subjects dynamically, without you having to update the Sample Generator when a new subject gets added. For example, `?absolutePath=NorthAmerica.UnitedStates.*&tags=City`
would return an array of subjects whose absolutePath starts with "NorthAmerica.UnitedStates." and which have subject tag 
"City".
- `context` (Object, optional) - provide values for any of the variables defined in the sample generator template's 
contextDefinition.

A Sample Generator in Refocus will also have an association with the Collector model, to assign zero or more collectors.
