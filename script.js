new Vue({
    el: '#app',
    data: {
        initialTime: 20, // Default initial time
        incrementTime: 5, // Default increment time
        offsetTime: 0,
        infusionCount: 1,
        timeRemaining: 0,
        timerInterval: null,
        tabTitleInterval: null,
        showSettings: true,
        timerRunning: false,
        selectedPreset: "",
        presets: [
            {name: 'White', waterTemp: 85, amount: 3.5, firstInfusion: 20, additionalInfusions: 10},
            {name: 'Green', waterTemp: 80, amount: 3, firstInfusion: 15, additionalInfusions: 3},
            {name: 'Yellow', waterTemp: 85, amount: 3.5, firstInfusion: 15, additionalInfusions: 5},
            {name: 'Oolong (strip)', waterTemp: 99, amount: 4.5, firstInfusion: 20, additionalInfusions: 5},
            {name: 'Oolong (ball)', waterTemp: 99, amount: 6, firstInfusion: 25, additionalInfusions: 5},
            {name: 'Black (small leaf)', waterTemp: 90, amount: 4.5, firstInfusion: 10, additionalInfusions: 5},
            {name: 'Black (large leaf)', waterTemp: 95, amount: 4, firstInfusion: 15, additionalInfusions: 5},
            {name: 'PuErh (raw)', waterTemp: 95, amount: 5, firstInfusion: 10, additionalInfusions: 3},
            {name: 'PuErh (ripe)', waterTemp: 99, amount: 5, firstInfusion: 10, additionalInfusions: 5}
        ],
        positivePercentageAdjustments: [10, 25, 50],
        negativePercentageAdjustments: [10, 25, 50].reverse(),
        beepWarning: new Audio('./audio/sonar_low.mp3'),
        beepEnd: new Audio('./audio/sonar_high.mp3'),
        beepWarningPlayed: false,
        beepEndPlayed: false,
    },
    computed: {
        nextInfusionTime() {
            const baseTime = this.initialTime + this.incrementTime * (this.infusionCount - 1);
            return baseTime + this.offsetTime;
        }
    },
    watch: {
        selectedPreset(newVal) {
            if (newVal) {
                this.initialTime = newVal.firstInfusion;
                this.incrementTime = newVal.additionalInfusions;
            } else {
                const storedSettings = JSON.parse(localStorage.getItem('customSettings'));
                this.initialTime = storedSettings ? storedSettings.initialTime : 20;
                this.incrementTime = storedSettings ? storedSettings.incrementTime : 5;
            }
            this.resetTimer();
        },
        offsetTime(newVal) {
            if (!this.timerRunning) {
                this.timeRemaining = parseFloat((this.nextInfusionTime).toFixed(1));
                this.updateDisplay();
            }
        }
    },
    methods: {
        updateDisplay() {
            document.title = `🍵 ${Math.round(this.timeRemaining)} - Gong Fu Tea Timer`;
        },
        resetTimer() {
            clearInterval(this.timerInterval);
            clearInterval(this.tabTitleInterval);
            this.timeRemaining = this.nextInfusionTime;
            this.timerRunning = false;
            this.updateDisplay();
        },
        toggleStartStop() {
            if (this.timerRunning) {
                this.resetTimer();
            } else {
                this.startTimer();
            }
        },
        startTimer() {
            this.timerRunning = true;

            this.timerInterval = setInterval(() => {
                this.timeRemaining = parseFloat((this.timeRemaining - 0.1).toFixed(1));
                if (this.timeRemaining <= 0) {
                    if (!this.beepEndPlayed) {
                        this.beepEnd.play();
                        this.beepEndPlayed = true;
                    }
                    clearInterval(this.timerInterval);
                    clearInterval(this.tabTitleInterval);
                    this.timeRemaining = 0;
                    this.infusionCount++;
                    this.initialTime += this.offsetTime;
                    this.offsetTime = 0;
                    localStorage.setItem('infusionCount', this.infusionCount);
                    this.resetTimer();
                } else if (this.timeRemaining <= 4 && !this.beepWarningPlayed) {
                    this.beepWarning.play();
                    this.beepWarningPlayed = true;
                }
                this.$forceUpdate();
            }, 100);

            this.tabTitleInterval = setInterval(() => {
                this.updateDisplay();
            }, 1000);
        },
        previousInfusion() {
            if (this.infusionCount > 1) {
                this.infusionCount--;
                localStorage.setItem('infusionCount', this.infusionCount);
                this.resetTimer();
            }
        },
        skipInfusion() {
            this.infusionCount++;
            localStorage.setItem('infusionCount', this.infusionCount);
            this.resetTimer();
        },
        confirmSettings() {
            const customSettings = {
                initialTime: this.initialTime,
                incrementTime: this.incrementTime
            };
            localStorage.setItem('customSettings', JSON.stringify(customSettings));
            this.showSettings = false;
            this.infusionCount = 1;
            localStorage.setItem('infusionCount', this.infusionCount);
            this.resetTimer();
        },
        backToSettings() {
            if (confirm('Are you sure you want to discard the current session and return to settings?')) {
                clearInterval(this.timerInterval);
                clearInterval(this.tabTitleInterval);
                this.offsetTime = 0;
                localStorage.removeItem('infusionCount');
                this.showSettings = true;
                document.title = "🍵 Gong Fu Tea Timer";
            }
        },
        adjustOffsetByPercentage(percentage) {
            if (!this.timerRunning) {
                this.offsetTime = (this.incrementTime * percentage) / 100;
                this.timeRemaining = parseFloat((this.nextInfusionTime + this.offsetTime).toFixed(1)); // Update current infusion time
                this.updateDisplay();
            }
        },
        loadSession() {
            const storedInfusionCount = localStorage.getItem('infusionCount');
            const storedSettings = JSON.parse(localStorage.getItem('customSettings'));
            if (storedInfusionCount !== null) {
                this.infusionCount = parseInt(storedInfusionCount);
                this.showSettings = false;
            }
            if (storedSettings !== null) {
                this.initialTime = storedSettings.initialTime;
                this.incrementTime = storedSettings.incrementTime;
            }
            this.resetTimer();
        }
    },
    mounted() {
        this.loadSession();
        this.beepWarning.load();
        this.beepEnd.load();
    }
});