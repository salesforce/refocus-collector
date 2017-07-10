# Sample Generator Template

A Sample Generator Template is a reusable component which defines how to collect a specific type of data and transform that
data into a set of samples which the Refocus Collector sends to Refocus.

#### NOTE: Design your Sample Generator Template for Reuse!

> For example, a “Trust1” SampleCollector should know how to collect data from Trust1, but the endpoint and status assignments should be configurable so that the component can be reused to collect data from any Trust1 implementation, not just the public salesforce.com (http://salesforce.com/) trust site.

## Attributes

A Sample Generator Template has following attributes:

- `name` (String, required) - the name of the sample generator template.
- `version` (String, required) - a version number in the form of `MAJOR.MINOR.PATCH`. Increment the MAJOR version when you 
make incompatible API changes; increment the MINOR version when you add functionality in a backwards-compatible manner; 
increment the PATCH version when you make backwards-compatible bug fixes. See http://semver.org/ for more 
information on semantic versioning.
- `description` (String, required) - a detailed description of the sample generator template. A good description will include 
sufficient information for a Refocus user to determine whether they want to use this template to generate their samples. 
Describe the purpose, the algorithm, the error handling, and anything else you want your users to understand about how this 
template works.
- `keywords` (Array of Strings, optional) - a list of keywords in the form of an array of strings. This will help users 
looking for an appropriate sample generator template.
- `author` (Object, required) - contact information for the author of the sample generator template, i.e. who to contact for 
help.
  - `name` (String, required)
  - `email` (String, required)
  - `url` (String, optional)
- `repository` (Object, optional)
  - `type` (String, optional, default = `git`)
  - `url` (String, required)
- `connection` (Object, required) - defines how to connect to the remote data source.
  - `method` (String, default=GET [DELETE|GET|HEAD|PATCH|POST|PUT])
  - `url` (String, one of either `url` or `toUrl` is required) - if you are specifying a string, you may embed substitution
  variables in the string using double curly braces, e.g.  http://www.xyz.com?id={{key}}. If no `url` string is provided here,
  you must provide a `toUrl` function.
  - `toUrl` (Array of Strings, one of either `url` or `toUrl` is required) - the body of a function which returns a url. Use
  this function if you need to do more complex transformations to generate a URL, rather than just simple variable 
  substitutions.
  - `bulk` (Boolean, optional, default=false) - set to `false` if you want to send one request for each of the designated 
  subjects; set to `true` if you want to collect data for all of the designated subjects in a single request.
  - `headers` (Object, optional) - headers to include in the request. For each named header, if you define it using an object (with attributes `description` (String), `required` (Boolean)), the Sample Generator is expected to provide the value; if you define it with a string, the header is set using that value.
  - `timeout` (Number, optional, default=[the Refocus Collector's default value], max=[some hard-coded max]) - the number of
  milliseconds to wait before aborting the request. If undefined or non-numeric values or greater than max, the connection 
  will use the Refocus Collector's default value.
- `contextDefinition` (Object, optional) - define any additional context data, available to the URL as a substitution 
variable and to the `toUrl` and `transform` functions via the functions' `context` argument. Each key defined here must
provide an object with the following attributes:
  - `description` (String, required) - provide enough detail for the user to understand what value to provide
  - `required` (Boolean, optional, default = `false`) - set to `true` if your users *must* provide a value for this context 
  variable in their sample generators.
  - `default` (Any, optional) - a value to populate the context variable when your users do not provide a value in their 
  sample generators.
- `transform` (Array of Strings, required) - the body of a JavaScript function which transforms some data into an array of
samples. The function must return an array of samples. Your function body has access to these variables:
  - `context` - a reference to the sample generator context data, with defaults applied.
  - `aspects` - an array of one or more aspects as specified by the sample generator.
  - `subject` - if `connection.bulk` is set to `false`, this is a reference to the subject.
  - `subjects` - if `connection.bulk` is set to `true`, this is reference to the array of subjects.
  - `res` - a reference to the HTTP response. See https://nodejs.org/api/http.html#http_class_http_incomingmessage for more
  details on the format of the HTTP response. Typically, you'll want to check `res.status` for the HTTP status code, and 
  `res.body` for the actual body of the response.
