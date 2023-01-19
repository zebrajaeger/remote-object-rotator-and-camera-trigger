#include <Arduino.h>
#include <ArduinoJson.h>
#include <FastAccelStepper.h>
#include <WebServer.h>
#include <WiFiManager.h>

#include "ota.h"

#define CAMERA_FOCUS_PIN 12
#define CAMERA_FOCUS_INVERT true
#define CAMERA_TRIGGER_PIN 13
#define CAMERA_TRIGGER_INVERT true

#define STEPPER_DIR_PIN 25
#define STEPPER_STEP_PIN 26
#define STEPPER_ENABLE_PIN 27

OTA ota;
WebServer server(80);
StaticJsonDocument<250> jsonDocument;
char buffer[250];
FastAccelStepperEngine engine = FastAccelStepperEngine();
FastAccelStepper *stepper = NULL;
TaskHandle_t Core0TaskHnd;

void CoreTask0(void *parameter) {
  engine.init();
  stepper = engine.stepperConnectToPin(STEPPER_STEP_PIN);
  if (stepper) {
    stepper->setDirectionPin(STEPPER_DIR_PIN);
    stepper->setEnablePin(STEPPER_ENABLE_PIN);
    stepper->setAutoEnable(true);

    stepper->setSpeedInHz(5000);
    stepper->setAcceleration(2500);
    for (;;) {
      // Serial.println(stepper->getCurrentPosition());
      yield();
      delay(1000);
    }
  }
}

void handleMove() {
  if (server.hasArg("plain") == false) {
    server.send(420, "application/text", "no body");
    return;
  }
  String body = server.arg("plain");
  deserializeJson(jsonDocument, body);

  int v = jsonDocument["steps"];
  Serial.print("Move ");
  Serial.println(v);
  stepper->move(v);

  server.send(200, "application/json", "{}");
}
void setOut(uint8_t pin, bool value, bool inverted) {
  if (inverted) {
    digitalWrite(pin, !value);
  } else {
    digitalWrite(pin, value);
  }
}

void handleCamera() {
  if (server.hasArg("plain") == false) {
    server.send(420, "application/text", "no body");
    return;
  }
  String body = server.arg("plain");
  deserializeJson(jsonDocument, body);

  int focusMs = jsonDocument["focus"];
  int triggerMs = jsonDocument["trigger"];
  Serial.print("FT: ");
  Serial.print(focusMs);
  Serial.print("/");
  Serial.println(triggerMs);

  if (focusMs > 0) {
    Serial.println("focus ON");
    setOut(CAMERA_FOCUS_PIN, CAMERA_FOCUS_INVERT, true);
    delay(focusMs);
    setOut(CAMERA_FOCUS_PIN, CAMERA_FOCUS_INVERT, false);
    Serial.println("focus OFF");
  }

  if (triggerMs > 0) {
    Serial.println("trigger ON");
    setOut(CAMERA_TRIGGER_PIN, CAMERA_TRIGGER_INVERT, true);
    delay(triggerMs);
    setOut(CAMERA_TRIGGER_PIN, CAMERA_TRIGGER_INVERT, false);
    Serial.println("trigger OFF");
  }

  server.send(200, "application/json", "{}");
}

void handleStatus() {
  jsonDocument.clear();
  jsonDocument["pos"] = stepper->getCurrentPosition();
  jsonDocument["running"] = stepper->isRunning();
  serializeJson(jsonDocument, buffer);
  server.send(200, "application/json", buffer);
}

void handleNotFound() { server.send(404, "text/plain", "Not found"); }

void setup() {
  Serial.begin(115200);

  Serial.print("Speed: ");
  Serial.print(getCpuFrequencyMhz());
  Serial.println("MHz");
  WiFiManager wifiManager;
  // wifiManager.resetSettings();
  wifiManager.autoConnect("AutoConnectAP");
  ota.begin();

  pinMode(CAMERA_TRIGGER_PIN, OUTPUT);
  pinMode(CAMERA_FOCUS_PIN, OUTPUT);
  setOut(CAMERA_TRIGGER_PIN, CAMERA_TRIGGER_INVERT, false);
  setOut(CAMERA_FOCUS_PIN, CAMERA_FOCUS_INVERT, false);

  server.on("/status", HTTP_GET, handleStatus);
  server.on("/move", HTTP_POST, handleMove);
  server.on("/camera", HTTP_POST, handleCamera);
  server.onNotFound(handleNotFound);
  server.begin();

  xTaskCreatePinnedToCore(CoreTask0, "CPU_1", 1000, NULL, 1, &Core0TaskHnd, 0);
}

void loop() {
  // ota.loop();
  server.handleClient();
}