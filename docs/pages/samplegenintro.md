# What's a Sample Generator?

We like to think of Sample Generators as the *brains* within a Collector. They provide information about the data source (e.g URI), user login credentials for the data source, transformation code to turn data values into Samples and much more. Analogously, Collectors are the *body*, they use this information to actively query the data source, transform data values into Samples and push them to Refocus.  We separated the *body* and the *brain* in order to modularize our system and make components interchangeable. Without Sample Generators, Collectors wouldn't know what to do and any Sample Generator can be interpreted by any Collector.

# What's in a Sample Generator?

Continuing our theme of modularity, Sample Generators leverage Generator Templates which define the transform code (Javascript code) used to create Samples. Generator Templates will often, but not always, be written by a third party. This is because we want to make it easy for non-technical users to get data into Refocus so we let them leverage code written by technical users. Generator Templates are meant to be reusable. Once written, many users will use the same Template to push data into Refocus. 

![Collector using SG Diagram](../assets/SGDiagram.jpeg)

This diagram illustrates the major components of a Sample Generator. You can see that they have a context where variable values are set and they also use Generator Templates. 

A Sample Generator specifies the particular Generator Template it wants to use. It then provides values to context variables that the Generator Template uses to execute its code.

In this simple example, the Generator Template returns an array of greetings that the user provides. The variables are user configurable and depend on the values set in the Sample Generator. 

The result here is an array of greetings but in reality, transform functions will return an array of Samples which will be sent to your Refocus instance. 

# Tell me more about Generator Templates

A Generator Template provides a Sample Generator with some Javascript code which transforms the response from your data source into Samples. Generator Templates are created with a specific data source in mind.

For example, I could write a Generator Template that leverages the API of my favorite Bitcoin exchange, BitX! It'll expect input data in the format used by that exchange as well as a mapping from currency value to Refocus Samples status. Then it will convert the return values into Samples for Refocus. 

Then let's say you want to track how your Bitcoin portfolio is performing in real time. You may want Refocus to show 'Critical' if Bitcoin prices drop below $3000 and 'Ok' otherwise. You would create a Sample Generator that references my Generator Template and provides a mapping from USD to Status as well as the URL for the BitX instance you want to query. Submit that to Refocus and you're done!

You don't need to know too much about how a Generator Template works - though you're free to inspect their source code.
What's important is that you know how to leverage them to get your data into Refocus!
