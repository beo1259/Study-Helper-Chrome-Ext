const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
const port = 3000;

const accountSid = 'ACcc223995e80a284f66262c6974a6e78e';
const authToken = 'edd16a6f3fa076eb7a57a470e27246f2';
const client = twilio(accountSid, authToken);

app.use(cors());
app.use(bodyParser.json());

app.post('/start-task', (req, res) => {
    const { to, taskName, duration } = req.body;
    
    setTimeout(() => {
        client.messages.create({
            body: `Task completed: ${taskName}`,
            from: '+15813336995', // my Twilio number
            to: to
        })
        .then(message => {
            console.log(`Task "${taskName}" completed. Message SID: ${message.sid}`);
        })
        .catch(error => {
            console.error(`Error sending completion message for task "${taskName}": ${error}`);
        });
    }, duration);

    res.send({ success: true, message: `Task "${taskName}" started, will complete in ${duration} milliseconds.` });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
