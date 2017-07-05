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
