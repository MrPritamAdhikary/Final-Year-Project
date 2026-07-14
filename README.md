# Gas Leakage Protection System

## Overview

The **Gas Leakage Protection System** is an IoT-based safety project
designed to detect gas leakage, provide immediate local warnings,
display real-time gas information on a mobile application, and send
Firebase Cloud Messaging (FCM) notifications when the mobile application
is closed.

The system uses an **ESP32 microcontroller** and a gas sensor to
continuously monitor the environment. Sensor data and gas status are
transmitted through **MQTT using HiveMQ Cloud**. A mobile application
developed using **MIT App Inventor** displays the live gas value and
provides an alarm, repeated vibration, visual warning, and popup alert
while the application is open and connected to MQTT.

For closed-app alerts, a **Node.js backend** listens to MQTT gas-status
messages and sends emergency notifications to the Android phone using
**Firebase Cloud Messaging**.

## Project Objectives

-   Detect possible gas leakage in real time.
-   Continuously monitor the gas sensor value.
-   Provide local LED and buzzer warnings.
-   Transmit sensor data over the Internet.
-   Display live gas values in a mobile application.
-   Classify the environment into Safe, Warning, and Gas Leak zones.
-   Trigger an in-app alarm, vibration, visual warning, and popup during
    leakage.
-   Send Firebase push notifications when the app is closed.
-   Repeat closed-app notifications while leakage continues.
-   Stop repeated backend notifications after the app opens and connects
    to MQTT.
-   Reset the alert logic when the gas status returns to `SAFE`.

## System Architecture

The system contains four major sections:

1.  **Gas Detection and Control Unit**
2.  **MQTT Cloud Communication**
3.  **Mobile Monitoring Application**
4.  **Firebase Notification Backend**

``` text
Gas / Smoke
     |
     v
Gas Sensor
     |
     v
ESP32
     |
     +--------------------+
     |                    |
     v                    v
LEDs + Buzzer        Wi-Fi / Internet
                          |
                          v
                    HiveMQ Cloud MQTT
                          |
             +------------+------------+
             |                         |
             v                         v
      MIT App Inventor            Node.js Backend
       Mobile Application              |
             |                         v
             |                   Firebase Admin SDK
             |                         |
             v                         v
 Alarm + Vibration + Popup       FCM Push Notification
```

## Components Required

### Hardware Components

  -----------------------------------------------------------------------
  Component                           Purpose
  ----------------------------------- -----------------------------------
  ESP32 Development Board             Main controller and Wi-Fi
                                      communication unit

  MQ/Gas Sensor                       Detects gas or smoke concentration

  Red LED                             Danger/leak indication

  Green LED                           Safe-condition indication

  Buzzer                              Local audible warning

  Resistors                           Current limiting and circuit
                                      support

  Breadboard                          Prototype construction

  Jumper Wires                        Circuit connections

  USB Cable                           ESP32 programming and power

  Power Supply                        Powers the system

  Android Smartphone                  Runs the monitoring app

  Laptop/Computer                     Runs the current Node.js
                                      notification backend
  -----------------------------------------------------------------------

### Software and Cloud Components

  Software / Service         Purpose
  -------------------------- -------------------------------------
  Arduino IDE                ESP32 firmware development
  MIT App Inventor           Android monitoring app development
  HiveMQ Cloud               MQTT broker
  Firebase Cloud Messaging   Android push notifications
  Firebase Admin SDK         Sends FCM messages from the backend
  Node.js                    Runs the notification backend
  MQTT Node.js Library       Connects the backend to MQTT
  Command Prompt             Runs `server.js`

## ESP32 Microcontroller

The **ESP32** is the central controller. It:

-   Reads the gas sensor.
-   Compares the gas value with the configured threshold.
-   Controls the red and green LEDs.
-   Controls the hardware buzzer.
-   Connects to Wi-Fi.
-   Connects to HiveMQ Cloud.
-   Publishes live gas values.
-   Publishes `SAFE` or `LEAK`.
-   Publishes a gas-alert message.

``` text
Read Gas Sensor
       |
       v
Compare With Threshold
       |
       +-----------------------+
       |                       |
Gas < Threshold          Gas >= Threshold
       |                       |
       v                       v
     SAFE                    LEAK
       |                       |
Green LED ON              Red LED ON
Red LED OFF               Green LED OFF
Buzzer OFF                Buzzer ON
Publish SAFE              Publish LEAK
```

## Gas Sensor and Risk Zones

The ESP32 reads the analog gas-sensor output using its ADC. The
application uses a display range of approximately `0` to `4095`.

  Gas Value               Zone                Display
  ----------------------- ------------------- ---------
  Less than 800           SAFE ZONE           Green
  800 to less than 1500   WARNING ZONE        Orange
  1500 or above           GAS LEAK DETECTED   Red

These are **project thresholds**, not certified industrial safety
limits. Sensor calibration, target gas, supply conditions, and the
installation environment affect actual readings.

## Local LED and Buzzer Operation

### Safe Condition

``` text
Green LED = ON
Red LED   = OFF
Buzzer    = OFF
Status    = SAFE
```

### Gas Leakage Condition

``` text
Green LED = OFF
Red LED   = ON
Buzzer    = ON
Status    = LEAK
```

The hardware buzzer provides an immediate local warning.

## MQTT Communication

The project uses MQTT's lightweight publish/subscribe model.

``` text
ESP32
  |
  | Publish
  v
HiveMQ Cloud
  |
  +----------------------+
  |                      |
  v                      v
Mobile App          Node.js Backend
Subscribe              Subscribe
```

## MQTT Topics

  MQTT Topic            Purpose
  --------------------- -------------------------------
  `pritam/gas/value`    Real-time gas sensor value
  `pritam/gas/status`   `SAFE` or `LEAK` status
  `pritam/gas/alert`    Emergency gas leakage message
  `pritam/gas/app`      App-open/connected signal

### `pritam/gas/value`

Example:

``` text
742
```

The mobile app uses this value for the live gas monitor and progress
display.

### `pritam/gas/status`

Possible messages:

``` text
SAFE
LEAK
```

This topic controls the main safe/leak behaviour.

### `pritam/gas/alert`

Example:

``` text
WARNING! GAS LEAKAGE DETECTED
```

The app uses the alert message for emergency handling.

### `pritam/gas/app`

When the mobile app connects to MQTT, it publishes:

``` text
APP_OPEN
```

The Node.js backend receives this signal and stops repeated Firebase
notifications for the current leak event.

## MIT App Inventor Mobile Application

The mobile application provides:

-   Live gas value.
-   Gas-level progress display.
-   Safe, warning, and danger classification.
-   MQTT cloud connection status.
-   Gas status display.
-   Green safe interface.
-   Red danger interface.
-   Gas leak popup.
-   Alarm sound.
-   Repeated phone vibration.
-   Firebase notification initialization.

### Live Gas Monitoring

When the app receives `pritam/gas/value`, its `MessageReceived` logic
updates:

-   `GasValueLabel`
-   `BigGasValueLabel`
-   Gas progress
-   Risk label
-   Gas monitor card colour

The progress value is approximately:

``` text
Gas Progress = (Gas Value / 4095) x 100
```

### Safe Zone

When the gas value is below `800`, the app displays:

``` text
SAFE ZONE
```

When the status is `SAFE`, the application stops the alarm, disables
repeated vibration, changes to the safe interface, and displays `SAFE`.

### Warning Zone

When:

``` text
800 <= Gas Value < 1500
```

the app displays:

``` text
WARNING ZONE
```

and uses an orange warning indication.

### Gas Leak While the App Is Open

When the status becomes `LEAK`, the app:

-   Changes the screen to red.
-   Displays `GAS LEAK DETECTED`.
-   Shows an emergency popup.
-   Starts the alarm player.
-   Enables the vibration timer.

``` text
MQTT Message Received
        |
        v
Check Topic
        |
        +-------------------------------+
        |                               |
gas/value                         gas/status
        |                               |
Update Value                      Check Status
Update Progress                         |
Update Risk Zone                 +------+------+
                                 |             |
                               SAFE           LEAK
                                 |             |
                            Stop Alarm     Start Alarm
                            Stop Vibrate   Start Vibrate
                            Green Screen   Red Screen
                                           Popup
```

## Repeated Vibration

The application uses a Clock component.

During a gas leak:

``` text
Clock.TimerEnabled = true
```

The Clock timer repeatedly calls:

``` text
Vibrate for 1000 ms
```

When the status becomes `SAFE`:

``` text
Clock.TimerEnabled = false
```

Repeated vibration stops.

## Firebase Cloud Messaging

Firebase Cloud Messaging provides the closed-app notification path.

MIT App Inventor MQTT blocks depend on the application and MQTT
connection. When the app is closed or disconnected, its
`MessageReceived`, Player, and vibration blocks cannot be relied upon to
run continuously.

The FCM flow is:

``` text
Gas Leak
   |
   v
ESP32 publishes LEAK
   |
   v
HiveMQ Cloud
   |
   v
Node.js server.js
   |
   v
Firebase Admin SDK
   |
   v
Firebase Cloud Messaging
   |
   v
Android Notification
```

## Node.js Notification Backend

The Node.js backend:

1.  Initializes Firebase Admin.
2.  Connects to HiveMQ Cloud.
3.  Subscribes to `pritam/gas/#`.
4.  Detects the `LEAK` status.
5.  Sends an FCM notification.
6.  Repeats the notification while leakage continues.
7.  Receives `APP_OPEN`.
8.  Stops repeated notifications after the app opens and connects.
9.  Resets the alert state after `SAFE`.

The backend is started with:

``` bash
node server.js
```

## Repeated Closed-App Notification Logic

``` text
Gas Status = LEAK
        |
        v
Set gasLeak = true
        |
        v
Send FCM Notification
        |
        v
Wait 5 Seconds
        |
        v
Is Gas Still LEAK?
        |
     +--+--+
     |     |
    YES    NO
     |     |
     v     v
Is App   Stop Alerts
Opened?
     |
  +--+--+
  |     |
 NO    YES
  |     |
  v     v
Send   Stop Repeated
Again  Notifications
```

Therefore:

``` text
APP CLOSED + LEAK
        |
        v
Notification
        |
      5 sec
        |
        v
Notification
        |
      5 sec
        |
        v
Notification
```

## Automatic Notification Stop After App Connection

The app uses `UrsPahoMqttClient1.ConnectionStateChanged`.

When:

``` text
NewState = true
```

the app subscribes to:

``` text
pritam/gas/value
pritam/gas/status
pritam/gas/alert
```

It then publishes:

``` text
Topic   = pritam/gas/app
Message = APP_OPEN
```

The backend receives:

``` text
TOPIC: pritam/gas/app
MESSAGE: APP_OPEN
```

It then stops repeated Firebase notifications for the current leak
event.

The app can continue displaying the live leak status and running its
in-app warning behaviour.

## Complete Working Sequence

### Normal Condition

1.  ESP32 reads the gas sensor.
2.  Gas value is below the leak threshold.
3.  Green LED turns ON.
4.  Red LED turns OFF.
5.  Buzzer remains OFF.
6.  ESP32 publishes the gas value.
7.  ESP32 publishes `SAFE`.
8.  The app displays the safe condition.

### Gas Leakage Condition

1.  Gas concentration increases.
2.  Sensor output rises.
3.  ESP32 detects the threshold condition.
4.  Red LED turns ON.
5.  Green LED turns OFF.
6.  Hardware buzzer turns ON.
7.  ESP32 publishes `LEAK`.
8.  ESP32 publishes the gas alert.
9.  The open app turns red.
10. The app displays `GAS LEAK DETECTED`.
11. A popup appears.
12. The mobile alarm starts.
13. Repeated vibration starts.
14. The Node.js backend receives `LEAK`.
15. Firebase notifications are sent.

### App Closed During Leakage

1.  MQTT status remains `LEAK`.
2.  Node.js continues monitoring HiveMQ Cloud.
3.  The backend sends an FCM notification.
4.  Notifications repeat according to the configured interval.
5.  The Android phone receives gas leak warnings.

### User Opens and Connects the App

1.  The app connects to MQTT.
2.  `ConnectionStateChanged` reports `NewState = true`.
3.  The app subscribes to the gas topics.
4.  The app publishes `APP_OPEN`.
5.  Node.js receives `APP_OPEN`.
6.  Repeated Firebase notifications stop.
7.  Live in-app monitoring continues.

### Gas Returns to SAFE

1.  Gas concentration decreases.
2.  ESP32 detects a value below the threshold.
3.  Green LED turns ON.
4.  Red LED turns OFF.
5.  Hardware buzzer turns OFF.
6.  ESP32 publishes `SAFE`.
7.  Mobile alarm stops.
8.  Mobile vibration stops.
9.  The app returns to the safe interface.
10. Node.js resets the gas-leak state.
11. The system is ready for the next leak event.

## How to Run the Project

### 1. Power the Hardware

Power the ESP32 gas leakage circuit and verify the sensor, LEDs, and
buzzer connections.

### 2. Connect the ESP32 to the Internet

The ESP32 uses its configured Wi-Fi credentials and connects to HiveMQ
Cloud.

### 3. Start the Notification Backend

Open Command Prompt and navigate to the backend folder:

``` bash
cd "C:\Users\HP\Desktop\Final Year Project\GasLeakageBackend"
```

Run:

``` bash
node server.js
```

Keep CMD open.

Expected output may include:

``` text
FIREBASE ADMIN INITIALIZED
MQTT CONNECTED
LISTENING: pritam/gas/#
```

### 4. Open the Mobile Application

Open **Gas Leakage Protection** and press:

``` text
CONNECT TO CLOUD
```

The app connects to MQTT and publishes `APP_OPEN`.

### 5. Test the Safe Condition

Keep the test gas source away from the sensor.

Verify:

-   Green LED ON.
-   Buzzer OFF.
-   Status `SAFE`.
-   Safe zone displayed.

### 6. Test the Gas Leakage Condition

Use an appropriate controlled demonstration source according to the
sensor and laboratory safety procedure.

Verify:

-   Gas value increases.
-   Red LED turns ON.
-   Green LED turns OFF.
-   Hardware buzzer starts.
-   App shows danger indication.
-   Popup appears.
-   Mobile alarm starts.
-   Phone vibrates repeatedly.

### 7. Test Closed-App Notification

Return the sensor to `SAFE` first.

Close or leave the mobile app and keep `server.js` running.

Trigger a new leak event.

Verify that Firebase gas-leak notifications are received and repeated.

Open the app and connect to MQTT. Verify that repeated backend
notifications stop.

## Current System Limitations

The current MIT App Inventor app cannot reliably execute its Player and
vibration blocks after the app process is closed.

Therefore:

-   **App open and MQTT connected:** live monitoring, popup, alarm, and
    repeated vibration work.
-   **App closed:** Firebase push notifications provide the remote
    warning.

The current Node.js backend runs on a laptop. The following must remain
active for closed-app notifications:

``` text
Laptop ON
Internet Connected
CMD Open
node server.js Running
```

If `server.js` stops, the backend cannot receive the MQTT gas status and
cannot send FCM notifications.

## Security Notes

Do **not** commit the following secrets to a public GitHub repository:

-   `serviceAccountKey.json`
-   Firebase service-account private keys
-   FCM device tokens
-   HiveMQ passwords
-   Wi-Fi passwords
-   ESP32 MQTT credentials

Use environment variables or secret management for production
deployment.

A recommended `.gitignore` includes:

``` gitignore
node_modules/
serviceAccountKey.json
.env
*.keystore
*.jks
```

## Future Improvements

-   Deploy the Node.js backend to a 24×7 cloud host.
-   Remove the laptop dependency.
-   Develop a native Android Kotlin application.
-   Add a native Android foreground emergency alarm service.
-   Add background siren and repeated vibration.
-   Calibrate the gas sensor for the target gas.
-   Add an automatic exhaust fan.
-   Add a solenoid gas shut-off valve.
-   Add SMS and emergency contact alerts.
-   Support multiple users.
-   Store gas leakage history.
-   Add gas trend graphs.
-   Add multiple room sensors.
-   Add battery backup.
-   Add an OLED/LCD display.
-   Add sensor-failure detection.
-   Add secure IoT device provisioning.
-   Add an emergency acknowledgement workflow.

## Advantages

-   Real-time gas monitoring.
-   IoT-based remote communication.
-   Local hardware alarm.
-   Mobile monitoring.
-   Visual risk classification.
-   In-app repeated vibration.
-   Emergency popup alerts.
-   Closed-app Firebase notifications.
-   Low-cost academic prototype.
-   Wi-Fi enabled.
-   Expandable architecture.

## Applications

The project concept can be applied to:

-   Domestic kitchens.
-   LPG monitoring.
-   Hostels.
-   Restaurants.
-   Laboratories.
-   Small industrial environments.
-   Gas storage areas.
-   Smart homes.
-   IoT safety monitoring systems.

For real-world safety deployment, certified sensors, calibrated
thresholds, fail-safe hardware, appropriate enclosures, regulatory
compliance, and professional installation are required.

## Technologies Used

``` text
ESP32
Gas Sensor
Embedded C/C++
Arduino IDE
Wi-Fi
IoT
MQTT
HiveMQ Cloud
MIT App Inventor
Firebase Cloud Messaging
Firebase Admin SDK
Node.js
Android
```

## Project Summary

The **Gas Leakage Protection System** combines embedded electronics, IoT
communication, mobile application development, and cloud notifications.

The ESP32 continuously monitors the gas sensor and controls local safety
indicators. HiveMQ Cloud provides MQTT communication between the ESP32,
mobile application, and Node.js backend. The MIT App Inventor
application provides live gas monitoring, risk classification, alarm
sound, repeated vibration, and popup alerts while connected. Firebase
Cloud Messaging provides an additional notification path when the mobile
application is not actively open.

The project demonstrates the practical integration of **ECE hardware,
embedded systems, IoT, MQTT, mobile application development, and cloud
messaging** in a single final-year project.

## Author

**Pritam Adhikary**

B.Tech --- Electronics and Communication Engineering

Final Year Project

**Project Title:** Gas Leakage Protection System
<img width="960" height="1280" alt="WhatsApp Image 2026-07-14 at 7 37 21 PM" src="https://github.com/user-attachments/assets/4b624bd1-0a3b-4e5f-a358-22f1a3a5d94e" />
