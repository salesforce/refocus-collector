# Introduction

Refocus makes it easy for users to understand the real-time status of their systems. To date, achieving this has required users to develop API integrations in order to push Samples into Refocus. This process had a few limitations: it required developers to write API integrations, and, at times, meant teams had to operate an extra 'always-on' service. 

Collectors are designed to tackle these issues and make it easier than ever to leverage all the capabilities of Refocus!

# So, what is a Collector 

A Collector is an out-of-the-box application, running outside of Refocus, which collects data from different data sources and sends Samples to Refocus. It does this by leveraging user-provided config files called a “Sample Generators”.
Most users will never have to maintain a collector, they'll just write Sample Generators.

## Data pipeline with collectors

![Collector using SG Diagram](../assets/CollectorDataflow.jpeg)

# Tell me more about Sample Generators

To use a simple analogy, Collectors are akin to the *human* *body*, they do the manual heavy-lifting, but everybody (and indeed everybody!) needs a brain in order to tell it what to do - the Sample Generator is that *brain*. 

We separated the *body* and the *brain* in order to modularize our system and make components interchangeable. Any Sample Generator can run on any Collector, and changes don't require system deploys making it swift and easy to get your data into Refocus.

![Collector using SG Diagram](../assets/CollectorSGDiagram.jpeg)

One Collector will run multiple Sample Generators at once - collecting and pushing Samples for each.

Each Sample Generator provides a path to your target data source, a set of subjects and aspects that you want to send samples for and other contextual information used by the transform code to generate samples.

![Collector using SG Diagram](../assets/SGDiagram.jpeg)

As is illustrated, the transform code leverages user-provided value to context variables. Most users will never interact with the transform code, instead, they will select the code template that works for them and provide the context variables that are required. 

Getting started with Refocus has never been easier! Write a Sample Generator, submit it to a Refocus instance and start visualizing!