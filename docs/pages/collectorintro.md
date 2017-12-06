# Introduction

Refocus makes it easy for users to understand the real-time status of their systems. To date, achieving this has required users to develop API integrations in order to push Samples into Refocus. This process had a few limitations: it required developers to write API integrations, and, at times, meant teams had to operate their own *always-on* service.

Collectors are designed to tackle these issues and make it easier than ever to leverage all the capabilities of Refocus!

# So, what is a Collector? 

A Collector is an out-of-the-box application, running outside of Refocus, which collects data from different data sources and sends Samples to Refocus. It does this by leveraging user-provided config files called a “Sample Generators”.

Collectors are meant to be shared so if there are already a couple of Collectors running in your environment, you can just keep adding new Sample Generators without necessarily deploying new Collectors.

## Data Pipeline with Collectors

![Collector using SG Diagram](../assets/CollectorDataflow.jpeg)

# Tell me more about Sample Generators

To use a simple analogy, Collectors are akin to the *human* *body*, they do the heavy lifting, but everybody (and indeed every body!) needs a brain in order to tell it what to do. The Sample Generator is that *brain*. 

Sample Generators can run on any Collector (as long as the Collector has access to the remote data source(s). Changes to a Sample Generator don't require any admin intervention--no application deploys or restarts or anything like that--so it's fast and easy to get your data into Refocus.

![Collector using SG Diagram](../assets/CollectorSGDiagram.jpeg)

Each Sample Generator provides a path to your target data source, a set of subjects and aspects that you want to send samples for, and other context variables used by the transform code to generate samples.

![Collector using SG Diagram](../assets/SGDiagram.jpeg)

As illustrated above, the transform code uses context variables you provide in your Sample Generator. Just select the right Sample Generator Template for your data source and specify *your* context data. 

*Note: If there is no Sample Generator Template for your data source, writing a new Sample Generator Template involves some configuration and a little bit of Javascript to write the transform function. We'll be providing some tooling to help with that... stay tuned!*
