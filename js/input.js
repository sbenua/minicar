class Input {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            drift: false,
            boost: false,
            nos: false
        };

        this.setupKeyboard();
        this.setupTouch();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            let action = '';
            switch (e.key) {
                case 'ArrowUp': case 'w': action = 'up'; break;
                case 'ArrowDown': case 's': action = 'down'; break;
                case 'ArrowLeft': case 'a': action = 'left'; break;
                case 'ArrowRight': case 'd': action = 'right'; break;
                case 'Shift': case ' ': action = 'drift'; break;
                case 'b': case 'Enter': action = 'boost'; break;
                case 'n': action = 'nos'; break;
            }
            if (action) {
                this.keys[action] = true;
                const btn = document.querySelector(`.control-btn[data-action="${action}"]`);
                if (btn) btn.classList.add('active');
            }
        });

        window.addEventListener('keyup', (e) => {
            let action = '';
            switch (e.key) {
                case 'ArrowUp': case 'w': action = 'up'; break;
                case 'ArrowDown': case 's': action = 'down'; break;
                case 'ArrowLeft': case 'a': action = 'left'; break;
                case 'ArrowRight': case 'd': action = 'right'; break;
                case 'Shift': case ' ': action = 'drift'; break;
                case 'b': case 'Enter': action = 'boost'; break;
                case 'n': action = 'nos'; break;
            }
            if (action) {
                this.keys[action] = false;
                const btn = document.querySelector(`.control-btn[data-action="${action}"]`);
                if (btn) btn.classList.remove('active');
            }
        });
    }

    setupTouch() {
        const buttons = document.querySelectorAll('.control-btn');

        buttons.forEach(btn => {
            // Prevent context menu on long press
            btn.addEventListener('contextmenu', e => e.preventDefault());

            const action = btn.dataset.action;

            const startHandler = (e) => {
                e.preventDefault();
                this.keys[action] = true;
                btn.classList.add('active');
            };

            const endHandler = (e) => {
                e.preventDefault();
                this.keys[action] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', startHandler, { passive: false });
            btn.addEventListener('touchend', endHandler, { passive: false });
            btn.addEventListener('mousedown', startHandler);
            btn.addEventListener('mouseup', endHandler);
            btn.addEventListener('mouseleave', endHandler);
        });
    }
}
