import positionValidation, { formatTime, createElement } from "./utils";
import moment from "moment";

export default class Widget {
  constructor() {
    this.modal = document.querySelector(".modal");
    this.inputPosition = document.querySelector("#coordinates");
    this.inputMesage = document.querySelector("#enter-text");
    this.buttonsRecord = document.querySelectorAll(".record");
    this.watch = this.timer();
  }

  init() {
    document.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        if (event.ctrlKey) {
          event.preventDefault();
          const textArea = this.inputMesage;
          const start = textArea.selectionStart;
          const end = textArea.selectionEnd;

          textArea.value =
            textArea.value.substring(0, start) +
            "\n" +
            textArea.value.substring(end);

          textArea.selectionStart = textArea.selectionEnd = start + 1;
        } else {
          event.preventDefault();
          const text = this.inputMesage.value;

          if (text.trim()) {
            const htmlText = `<div class="data">${text}</div>`;
            this.getPosition(htmlText);
          }
        }
      }
    });

    document.addEventListener("click", async (event) => {
      const target = event.target;

      if (target.classList.contains("cancel")) {
        this.resetInput(this.inputPosition);
        this.closeModal();
      }

      if (target.classList.contains("ok")) {
        const position = this.inputPosition.value.trim();
        const text = this.inputMesage.value;

        const validPosition = positionValidation(position);

        if (validPosition) {
          this.addTextMessage(text, validPosition);
          this.resetInput(this.inputPosition);
          this.resetInput(this.inputMesage);
          this.closeModal();
        }
        this.showError();
      }

      if (target.classList.contains("record-video")) {
        this.hideButtonsRecord();
        const confirmVideoRecord = document.querySelector(".confirm-record");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 670 },
            height: { ideal: 680 },
            facingMode: "user",
          },
        });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.addEventListener("dataavailable", (event) => {
          chunks.push(event.data);
        });

        recorder.addEventListener("stop", () => {
          const blob = new Blob(chunks);

          const videoSrc = URL.createObjectURL(blob);

          const videoPlayer = `<video class="audio-player" controls src="${videoSrc}"></video>`;

          this.getPosition(videoPlayer);
        });

        recorder.start();

        confirmVideoRecord.addEventListener("click", () => {
          console.log("click");
          recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
          this.cancelRecord();
        });
      }

      if (target.classList.contains("record-audio")) {
        this.hideButtonsRecord();
        const confirmAudioRecord = document.querySelector(".confirm-record");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.addEventListener("dataavailable", (event) => {
          chunks.push(event.data);
        });

        recorder.addEventListener("stop", () => {
          const blob = new Blob(chunks);

          const src = URL.createObjectURL(blob);

          const player = `<audio class="audio-player" controls src="${src}"></audio>`;

          this.getPosition(player);
        });

        recorder.start();

        confirmAudioRecord.addEventListener("click", () => {
          recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
          this.cancelRecord();
        });
      }

      if (target.classList.contains("cancel-record")) {
        this.cancelRecord();
      }
    });
  }

  hideButtonsRecord() {
    this.buttonsRecord.forEach((button) => button.classList.add("icon"));
    this.showRecordingButtons();
  }

  cancelRecord() {
    this.watch.stop();
    const removeElement = document.querySelectorAll(".del");
    removeElement.forEach((element) => element.remove());
    this.buttonsRecord.forEach((element) => element.classList.remove("icon"));
  }

  addTextMessage(text, position) {
    const listMessages = document.querySelector(".list-message");
    const textMessage = createElement("div", {
      className: "message-container",
      innerHTML: `
        <div class="text-and_date">
            ${text}
            <div class="date">${moment().format("HH:mm DD.MM.YYYY")}</div>
        </div>
        <div class="geolocation">[${position}]</div>
        `,
    });
    listMessages.insertAdjacentElement("afterbegin", textMessage);
    listMessages.scrollTop = 0;
  }

  getPosition(text) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (data) => {
          const { latitude, longitude } = data.coords;
          const position = `${latitude},-${longitude}`;
          this.addTextMessage(text, position);
          this.resetInput(this.inputMesage);
        },
        (error) => {
          this.showModal();
          console.error(error);
        },
        { enableHighAccuracy: true },
      );
    }
  }

  showModal() {
    this.modal.className = "modal active";
  }

  closeModal() {
    this.modal.classList.remove("active");
    this.inputPosition.value = "";
  }

  resetInput(input) {
    input.value = "";
  }

  showError() {
    const buttons = document.querySelector(".buttons");
    const okButton = document.querySelector("#ok-btn");
    const error = document.createElement("span");
    error.textContent = "Данные некорректны";
    error.style.color = "#B22222";
    error.fontSize = "10px";
    buttons.insertBefore(error, okButton);
    setTimeout(() => {
      error.remove();
    }, 2000);
  }

  showRecordingButtons() {
    const createMessage = document.querySelector(".create-message");

    const confirm = document.createElement("i");
    confirm.className = "fa-solid fa-check confirm-record del";
    createMessage.append(confirm);

    const timer = document.createElement("span");
    timer.className = "timer del";
    timer.textContent = "00:00";
    createMessage.append(timer);

    this.watch.start((formattedTime) => {
      timer.textContent = formattedTime;
    });

    const cancel = document.createElement("i");
    cancel.className = "fa-solid fa-xmark cancel-record del";
    createMessage.append(cancel);
  }

  timer() {
    let seconds = 0;
    let intervalId = null;

    return {
      start(callback) {
        if (intervalId) return;
        intervalId = setInterval(() => {
          seconds++;
          if (callback) callback(formatTime(seconds));
        }, 1000);
      },
      stop() {
        clearInterval(intervalId);
        seconds = 0;
        intervalId = null;
      },
    };
  }
}
