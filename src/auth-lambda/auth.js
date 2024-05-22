exports.handler = async (event) => {
    let api_key = process.env.API_KEY
    let policy = {
        "principalId": "user",
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": "Allow",
                    "Resource": [],
                }
            ],
        },
        "context": {"probability": "0"},
    };

    if (event.headers['x-api-key'] === api_key) {
        console.log("allowed");
        policy = {
            "principalId": "user",
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Allow",
                        "Resource": [event["methodArn"]],
                    }
                ],
            },
            "context": {"probability": "100"},
        }
    }

    return policy;
};
