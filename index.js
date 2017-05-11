let request = require('request');
const YAML = require('yamljs');

/*
    Required environment vars
 */
const userAgent = process.env['USER_AGENT']
const username = process.env['USERNAME']
const email = process.env['EMAIL']
const key = process.env['KEY']

const urlToUpdate = `https://${username}:${key}@api.github.com/repos/andene/texteditors/contents/_data/editors.yml`


/**
 * Takes a URL for a Github repository and remove the
 * first part containing github.com
 * @param url
 * @returns {string}
 */
const parseUrlForRepoName = (url) => {
    if (url.indexOf('https') < 0) {

    }
    const githubString = 'https://github.com'
    return url.substring(githubString.length, url.length)
}

/**
 * Return information for a Github repsository
 * Resolves with information parsed as JSON
 * @param url
 * @returns {Promise}
 */
const getRepoInformation = (url) => {

    return new Promise((resolve, reject) => {
        const options = {
            url: url,
            headers: {
                'User-Agent': userAgent
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                reject(error)
                return
            }

            const repoData = JSON.parse(body)
            console.info(`Fetched:: ${repoData.name} (${repoData.url})`)
            resolve(repoData)
        })
    })
}


/**
 * Updates selected properties on editor object
 * @param githubInformation
 * @param editor
 */
const updateFile = (githubInformation, editor) => {
    editor.stargazers_count = githubInformation.stargazers_count
    editor.open_issues = githubInformation.open_issues
    editor.watchers = githubInformation.watchers
    editor.updated_at = githubInformation.updated_at
    editor.github_description = githubInformation.description
}




const start = (event, context, callback) => { //Learn more about these lamba params at http://docs.aws.amazon.com/lambda/latest/dg/welcome.html

    const options = {
        url: urlToUpdate,
        method: 'GET',
        headers: {
            'User-Agent': userAgent
        }
    }

    getRepoInformation(options.url)
        .then(repoData => {
            const fileContent = Buffer.from(repoData.content, 'base64')
            const content = String(fileContent)
            const editorsInConfigFile = YAML.parse(content)


            const repoFetches = editorsInConfigFile.map(editor => {
                const repoPath = parseUrlForRepoName(editor.github)
                const repoUrl = `https://${username}:${key}@api.github.com/repos${repoPath}`
                return getRepoInformation(repoUrl)
                    .then(repoInformation => {
                        updateFile(repoInformation, editor)
                    })
            })


            Promise.all(repoFetches).then(() => {
                console.info(`All editors updated`)

                const yamlString = YAML.stringify(editorsInConfigFile, 2)
                const base64Yaml = new Buffer(yamlString)

                const options = {
                    url: urlToUpdate,
                    method: 'PUT',
                    headers: {
                        'User-Agent': userAgent
                    }
                }

                options.body = JSON.stringify({
                    "message": "Updated editors.yml with Lambda",
                    "committer": {
                        "name": username,
                        "email": email
                    },
                    "content": base64Yaml.toString('base64'),
                    "sha": repoData.sha
                })

                request(options, function (error, response, body) {
                    if (error) {
                        console.error(error)
                    }

                    const parsedBody = JSON.parse(body)
                    const result = `Done:: File is pushed with SHA: ${parsedBody.commit.sha} (${parsedBody.commit.html_url})`
                    callback(null, result);
                })

            })

        })

}


if (process.env['LAMBDA_TASK_ROOT']) { // Running in AWS Lamba
    exports.handler = (event, context, callback) => {
        process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
        start(event, context, callback)
    }

} else { // Running in local environment
    start({}, {}, (error, result) => {
        console.info(result)
    })
}
