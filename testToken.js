const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount)
});

const token = "xxx";

const message = {
  notification: {
    title: "GAS LEAK TEST",
    body: "Direct Firebase notification test successful."
  },
  token: token
};

getMessaging()
  .send(message)
  .then((response) => {
    console.log("DIRECT FCM SENT SUCCESSFULLY");
    console.log(response);
  })
  .catch((error) => {
  console.log("FCM ERROR CODE:", error.code);
  console.log("FCM ERROR MESSAGE:", error.message);
});
