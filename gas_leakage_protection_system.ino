
/*
  Gas Leakage Protection System (Skeleton)
  NOTE:
  This file is a ready starting point that fixes the blocking Wi-Fi logic.
  Fill in your WiFi and HiveMQ credentials where indicated.

  Hardware:
  MQ2 AO -> GPIO34
  RED LED -> GPIO25
  GREEN LED -> GPIO26
  BUZZER -> GPIO27
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

const char* ssid = "moto edge 60 fusion";
const char* wifi_password = "WahShampiWah";

const char* mqtt_server = "0b7a0207350e48139ae6644afb704499.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "gasproject";
const char* mqtt_password = "PritamGasproject@2003";

#define MQ_PIN 34
#define RED_LED 22
#define GREEN_LED 23
#define BUZZER 27

const char* topic_value="pritam/gas/value";
const char* topic_status="pritam/gas/status";
const char* topic_alert="pritam/gas/alert";

WiFiClientSecure secureClient;
PubSubClient client(secureClient);

int gasThreshold=1500;
bool alertSent=false;
unsigned long lastSample=0;

void wifiTask(){
  static unsigned long lastTry=0;
  if(WiFi.status()==WL_CONNECTED) return;
  if(millis()-lastTry<5000) return;
  lastTry=millis();
  WiFi.begin(ssid,wifi_password);
}

void mqttTask(){
  static unsigned long lastTry=0;
  if(WiFi.status()!=WL_CONNECTED) return;
  if(client.connected()) return;
  if(millis()-lastTry<5000) return;
  lastTry=millis();
  String id="ESP32Gas-"+String((uint32_t)ESP.getEfuseMac(),HEX);
  client.connect(id.c_str(),mqtt_username,mqtt_password);
}

void publishValue(const char* t,const char* p){
  if(client.connected()) client.publish(t,p);
}

void setup(){
  Serial.begin(115200);
  pinMode(RED_LED,OUTPUT);
  pinMode(GREEN_LED,OUTPUT);
  pinMode(BUZZER,OUTPUT);
  pinMode(MQ_PIN,INPUT);

  secureClient.setInsecure();
  client.setServer(mqtt_server,mqtt_port);

  // Hardware self-test
  digitalWrite(RED_LED,HIGH); delay(1000);
  digitalWrite(RED_LED,LOW);
  digitalWrite(GREEN_LED,HIGH); delay(1000);
  digitalWrite(GREEN_LED,LOW);
  digitalWrite(BUZZER,HIGH); delay(500);
  digitalWrite(BUZZER,LOW);
}

void loop(){
  wifiTask();
  mqttTask();
  if(client.connected()) client.loop();

  if(millis()-lastSample>=1000){
    lastSample=millis();

    int gas=analogRead(MQ_PIN);
    Serial.println(gas);

    char buf[12];
    sprintf(buf,"%d",gas);
    publishValue(topic_value,buf);

    if(gas>=gasThreshold){
      digitalWrite(RED_LED,HIGH);
      digitalWrite(GREEN_LED,LOW);
      digitalWrite(BUZZER,HIGH);
      publishValue(topic_status,"LEAK");
      if(!alertSent){
        publishValue(topic_alert,"WARNING! GAS LEAKAGE DETECTED");
        alertSent=true;
      }
    }else{
      digitalWrite(RED_LED,LOW);
      digitalWrite(GREEN_LED,HIGH);
      digitalWrite(BUZZER,LOW);
      publishValue(topic_status,"SAFE");
      alertSent=false;
    }
  }
}
