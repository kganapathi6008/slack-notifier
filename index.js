const { IncomingWebhook } = require('@slack/webhook');

const SLACK_WEBHOOK_URL = ''; // Enter Your Slack Webhook URL here

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

// subscribe is the main function called by Cloud Functions.
module.exports.subscribe = (event) => {
  const build = eventToBuild(event.data);

  // Skip if the current status is not in the status list.
  // Add additional status to list if you'd like:
  // SUCCESS, FAILURE, INTERNAL_ERROR, TIMEOUT, CANCELLED
  const status = [
    'SUCCESS',
    'FAILURE',
    'INTERNAL_ERROR',
    'TIMEOUT',
    'CANCELLED',
  ];

  // Send message to Slack.
  const message = createSlackMessage(build);

  (async () => {
    await webhook.send(message);
  })();
};

// eventToBuild transforms pubsub event message to a build object.
const eventToBuild = (data) => {
  return JSON.parse(Buffer.from(data, 'base64').toString());
};

// createSlackMessage create a message from a build object.
const createSlackMessage = (build) => {
  let buildId = build.id || '';
  let buildCommit = build.substitutions.COMMIT_SHA || '';
  let branch = build.substitutions.BRANCH_NAME || '';
  let repoName = build.source.repoSource.repoName.split('_').pop() || ''; //Get repository name

  let message = {
    text: `Build - \`${buildId}\``,
    mrkdwn: true,
    attachments: [
      {
        title: 'View Build Logs',
        title_link: build.logUrl,
        fields: [
          {
            title: 'Status',
            value: build.status,
          },
        ],
      },
      {
        title: `Commit - ${buildCommit}`,
        title_link: `https://bitbucket.org/<ORGANIZATION-NAME>/${repoName}/commits/${buildCommit}`, // Insert your Organization/Bitbucket/Github Url
        fields: [
          {
            title: 'Branch',
            value: branch,
          },
          {
            title: 'Repository',
            value: repoName,
          },
        ],
      },
    ],
  };
  if (build.status === 'FAILURE') {
        message.attachments.push(
            {
                title: `Failure Info`,
                fields: [
                    {
                        title: 'Info',
                        value: `${JSON.stringify(build.failureInfo)}`,
                    },
                ],
            }
        );
    };
  return message;
};
