# Download and update a file via Github API

This is the source code that I run as a Lambda function i AWS to update the content of [https://nexttexteditor.com](https://nexttexteditor.com)

Read more on how [I update a page hosted on Github pages using AWS Lambda here](https://medium.com/the-everyday-developer/how-i-update-dynamic-content-on-github-pages-with-aws-lambda-ddb70e9739c7).

## Run the function

```javascript

USER_AGENT=github_username KEY=guthub_access_tokens USERNAME=github_username EMAIL=guthub_email node index.js

```
