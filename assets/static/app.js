document.addEventListener("DOMContentLoaded", function () {
    // Delete buttons: uses data-delete-url and data-delete-redirect attributes
    document.querySelectorAll("[data-delete-url]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            var deleteUrl = this.getAttribute("data-delete-url");
            var redirectTo = this.getAttribute("data-delete-redirect");
            if (confirm("Are you sure you want to delete this item?")) {
                var xhr = new XMLHttpRequest();
                xhr.open("DELETE", deleteUrl, true);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        window.location.href = redirectTo;
                    }
                };
                xhr.send();
            }
        });
    });

    // Dynamic input cloning for "add more" buttons
    document.querySelectorAll(".add-more").forEach(function (button) {
        button.addEventListener("click", function () {
            var group = this.getAttribute("data-group");
            var first = document.getElementById(group + "-inputs").querySelector("input");
            if (first) {
                var clonedInput = first.cloneNode();
                clonedInput.value = "";
                var container = document.getElementById(group + "-inputs");
                container.appendChild(clonedInput);
            }
        });
    });

    // Clickable rows/cards: navigates to data-href on click
    document.querySelectorAll("[data-href]").forEach(function (el) {
        el.addEventListener("click", function () {
            window.location.href = el.getAttribute("data-href");
        });
    });

    // Copy to clipboard: uses data-copy attribute
    document.querySelectorAll("[data-copy]").forEach(function (button) {
        button.addEventListener("click", function () {
            var text = this.getAttribute("data-copy");
            var btn = this;
            var original = btn.textContent;
            navigator.clipboard.writeText(text).then(function () {
                btn.textContent = "Copied!";
                window.setTimeout(function () {
                    btn.textContent = original;
                }, 1500);
            });
        });
    });

    // Select on focus: uses data-select-on-focus attribute
    document.querySelectorAll("[data-select-on-focus]").forEach(function (input) {
        input.addEventListener("focus", function () {
            this.select();
        });
    });

    // Auto-submit form on change: uses data-submit-on-change attribute
    document.querySelectorAll("[data-submit-on-change]").forEach(function (el) {
        el.addEventListener("change", function () {
            this.form.submit();
        });
    });

    // Session refresh: only runs when body has data-authenticated
    if (document.body.hasAttribute("data-authenticated")) {
        setInterval(function () {
            fetch("/api/auth/oidc/refresh").then(function (r) {
                if (!r.ok) {
                    _clearEl(document.body);
                    var expDiv = _el("div", "text-center mt-6");
                    expDiv.appendChild(_el("h2", null, "Session expired"));
                    expDiv.appendChild(_el("p", null, "Connection lost. Re-authenticate."));
                    var link = _el("a", null, "Jack In Again");
                    link.href = "/api/auth/oidc/authorize";
                    expDiv.appendChild(link);
                    document.body.appendChild(expDiv);
                }
            });
        }, 12 * 60 * 1000);
    }

    // =====================================================
    //  DOM Helpers — safe element builders (no innerHTML)
    // =====================================================
    function _el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function _feedLine(ts, tagCls, tagText, bodyText) {
        var div = _el("div", "hack-line");
        div.appendChild(_el("span", "feed-timestamp", ts));
        div.appendChild(document.createTextNode(" "));
        div.appendChild(_el("span", "feed-tag " + tagCls, tagText));
        div.appendChild(document.createTextNode(" " + bodyText));
        return div;
    }

    function _clearEl(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    // =====================================================
    //  Network Feed — simulated hacker event stream
    // =====================================================
    (function () {
        var feed = document.getElementById("network-feed") || document.getElementById("activity-feed");
        if (!feed) return;

        var names = [
            "gh0st", "cipher", "n0va", "bl4ckout", "sp3ctr3", "z3r0day",
            "phantom", "v1per", "neon", "glitch", "raz0r", "syn4pse",
            "d4rknet", "wr4ith", "h4x0r", "null_ptr", "cr0w", "sh4d0w",
            "byteKill", "root_kit", "xpl0it", "m0rph", "dr1ft", "sk3ll"
        ];

        var nodes = [
            "NODE-7A2F", "GRID-04", "NEXUS-9", "VAULT-13", "RELAY-88",
            "CORE-X1", "ARC-55", "SHARD-02", "HUB-31", "LINK-17",
            "PROXY-6C", "CELL-42", "TOWER-09", "GATE-77", "MESH-3D"
        ];

        var templates = [
            { tag: "breach", msgs: [
                "{name} breached {node} — {n} records exfiltrated",
                "Firewall on {node} compromised by {name}",
                "{node} perimeter breach detected — {name} inside",
                "Intrusion alert: {name} accessing {node} mainframe"
            ]},
            { tag: "syndicate", msgs: [
                "Syndicate [{syn}] recruited {name} as operative",
                "[{syn}] declared turf war on [{syn2}]",
                "{name} promoted to lieutenant in [{syn}]",
                "Alliance formed: [{syn}] + [{syn2}]"
            ]},
            { tag: "heist", msgs: [
                "{name} extracted {credits} credits from {node}",
                "Heist complete: {node} drained by {name} — {credits}cr profit",
                "{name} fenced {n} exploits on the black market",
                "Operation BLACKOUT netted {credits} credits for {name}"
            ]},
            { tag: "alert", msgs: [
                "WARNING: {node} under DDoS — shields at {pct}%",
                "ICE countermeasure deployed on {node}",
                "Trace initiated on {name} — ETA {n}s",
                "ALERT: {node} quarantined by sysadmin"
            ]},
            { tag: "system", msgs: [
                "{n} operatives connected to the mesh",
                "Network latency spike: {node} routing degraded",
                "Scheduled maintenance on {node} in {n} cycles",
                "Global credit pool: {credits}cr"
            ]}
        ];

        var syndicates = [
            "PHANTOM_COLLECTIVE", "NEON_WOLVES", "DEAD_CHANNEL",
            "ZERO_DIVISION", "IRON_GRID", "DARK_SIGNAL", "BYTE_CARTEL"
        ];

        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function pad2(n) { return n < 10 ? "0" + n : "" + n; }

        function timestamp() {
            var d = new Date();
            return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
        }

        function formatCredits(n) {
            if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
            if (n >= 1000) return (n / 1000).toFixed(1) + "K";
            return "" + n;
        }

        function generateEvent() {
            var group = pick(templates);
            var msg = pick(group.msgs);
            msg = msg.replace(/\{name\}/g, pick(names));
            msg = msg.replace(/\{node\}/g, pick(nodes));
            msg = msg.replace(/\{n\}/g, "" + randInt(3, 9999));
            msg = msg.replace(/\{credits\}/g, formatCredits(randInt(500, 5000000)));
            msg = msg.replace(/\{pct\}/g, "" + randInt(5, 48));
            msg = msg.replace(/\{syn\}/g, pick(syndicates));
            msg = msg.replace(/\{syn2\}/g, pick(syndicates));
            return { tag: group.tag, text: msg };
        }

        function addLine() {
            var ev = generateEvent();
            var div = _el("div", "feed-line");
            div.appendChild(_el("span", "feed-timestamp", timestamp()));
            div.appendChild(document.createTextNode(" "));
            div.appendChild(_el("span", "feed-tag " + ev.tag, ev.tag.toUpperCase().slice(0, 3)));
            div.appendChild(document.createTextNode(" " + ev.text));
            feed.appendChild(div);
            // Cap at 50 lines
            while (feed.children.length > 50) {
                feed.removeChild(feed.firstChild);
            }
            feed.scrollTop = feed.scrollHeight;
        }

        // Start the feed after a short delay
        setTimeout(function tick() {
            addLine();
            setTimeout(tick, randInt(2000, 3000));
        }, 1500);
    })();

    // =====================================================
    //  Stat Counters — animate from 0 to data-count-to
    // =====================================================
    (function () {
        var counters = document.querySelectorAll("[data-count-to]");
        if (!counters.length) return;

        function formatNumber(n, fmt) {
            if (fmt === "abbr") {
                if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
                if (n >= 1000) return (n / 1000).toFixed(1) + "K";
            }
            return n.toLocaleString();
        }

        function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

        function animateCounter(el) {
            var target = parseInt(el.getAttribute("data-count-to"), 10);
            var fmt = el.getAttribute("data-format") || "";
            var duration = 2000;
            var start = null;

            function step(ts) {
                if (!start) start = ts;
                var progress = Math.min((ts - start) / duration, 1);
                var value = Math.floor(easeOutQuart(progress) * target);
                el.textContent = formatNumber(value, fmt);
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = formatNumber(target, fmt);
                }
            }

            requestAnimationFrame(step);
        }

        // Use IntersectionObserver so counters animate when scrolled into view
        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });

            counters.forEach(function (el) { observer.observe(el); });
        } else {
            // Fallback: animate immediately
            counters.forEach(animateCounter);
        }
    })();

    // =====================================================
    //  Typewriter Effect (CSP-safe: no inline styles)
    // =====================================================
    (function () {
        var els = document.querySelectorAll(".typewriter");
        els.forEach(function (el) {
            // Skip on narrow screens where white-space: normal applies
            if (window.innerWidth <= 768) return;

            var fullText = el.textContent;
            el.textContent = "";
            el.classList.add("typewriter-active");
            var i = 0;

            function type() {
                if (i < fullText.length) {
                    el.textContent += fullText.charAt(i);
                    i++;
                    setTimeout(type, 30);
                } else {
                    el.classList.remove("typewriter-active");
                    el.classList.add("done");
                }
            }

            setTimeout(type, 800);
        });
    })();

    // =====================================================
    //  Scroll Reveal — IntersectionObserver for .fade-in-up
    // =====================================================
    (function () {
        var revealEls = document.querySelectorAll(".fade-in-up");
        if (!revealEls.length || !("IntersectionObserver" in window)) {
            // Fallback: just show them
            revealEls.forEach(function (el) { el.classList.add("visible"); });
            return;
        }

        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    // Stagger based on element index within its row
                    var parent = entry.target.parentElement && entry.target.parentElement.parentElement;
                    var siblings = parent ? parent.querySelectorAll(".fade-in-up") : [];
                    var idx = Array.prototype.indexOf.call(siblings, entry.target);
                    var delay = Math.max(0, idx) * 120;

                    setTimeout(function () {
                        entry.target.classList.add("visible");
                    }, delay);
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealEls.forEach(function (el) { revealObserver.observe(el); });
    })();

    // =====================================================
    //  Cyber-Tabs: Tab Switching (Cybercore is CSS-only)
    // =====================================================
    (function () {
        document.querySelectorAll(".cyber-tabs").forEach(function (tabGroup) {
            var tabs = tabGroup.querySelectorAll(".cyber-tab");
            var panels = tabGroup.querySelectorAll(".cyber-tabs__panel");
            tabs.forEach(function (tab) {
                tab.addEventListener("click", function () {
                    var target = this.getAttribute("data-tab");
                    tabs.forEach(function (t) { t.classList.remove("cyber-tab--active"); });
                    panels.forEach(function (p) { p.classList.remove("cyber-tabs__panel--active"); });
                    this.classList.add("cyber-tab--active");
                    var panel = tabGroup.querySelector('[data-panel="' + target + '"]');
                    if (panel) panel.classList.add("cyber-tabs__panel--active");
                });
            });
        });
    })();

    // =====================================================
    //  Module 1: Game State Manager
    // =====================================================
    (function () {
        var STORAGE_KEY = "faultline_state";
        var DEFAULTS = {
            credits: 500,
            lastTick: Date.now(),
            nerve:   { current: 50,  max: 50,  regenRate: 300 },
            energy:  { current: 100, max: 100, regenRate: 600 },
            health:  { current: 100, max: 100, regenRate: 180 },
            rep:     { current: 10,  max: 100, regenRate: 0 },
            cooldowns: {},
            events: [],
            totalOps: 0,
            territory: [],
            attackCooldown: 0,
            purchases: {},
            inventory: []
        };

        function loadState() {
            var state;
            try {
                var raw = localStorage.getItem(STORAGE_KEY);
                state = raw ? JSON.parse(raw) : null;
            } catch (e) {
                state = null;
            }
            if (!state) {
                state = JSON.parse(JSON.stringify(DEFAULTS));
                state.lastTick = Date.now();
                saveState(state);
                return state;
            }
            // Merge defaults for any missing keys
            var res = ["nerve", "energy", "health", "rep"];
            for (var i = 0; i < res.length; i++) {
                if (!state[res[i]]) state[res[i]] = JSON.parse(JSON.stringify(DEFAULTS[res[i]]));
            }
            if (state.cooldowns === undefined) state.cooldowns = {};
            if (state.events === undefined) state.events = [];
            if (state.totalOps === undefined) state.totalOps = 0;
            if (state.territory === undefined) state.territory = [];
            if (state.attackCooldown === undefined) state.attackCooldown = 0;
            if (state.purchases === undefined) state.purchases = {};
            if (state.inventory === undefined) state.inventory = [];
            if (state.credits === undefined) state.credits = DEFAULTS.credits;
            if (state.level === undefined) state.level = 1;
            if (state.xp === undefined) state.xp = 0;
            if (state.exploitPoints === undefined) state.exploitPoints = 0;
            if (!state.stats) state.stats = { cracking: 1, stealth: 1, firewall: 1, bandwidth: 1 };
            if (state.lastTrainTime === undefined) state.lastTrainTime = 0;
            if (!state.currentNetwork) state.currentNetwork = "clearnet";
            if (state.selectedTarget === undefined) state.selectedTarget = null;
            if (state.activeMission === undefined) state.activeMission = null;
            if (state.missionCooldown === undefined) state.missionCooldown = 0;
            if (state.completedMissions === undefined) state.completedMissions = 0;
            if (!state.merits) state.merits = {};

            // Calculate offline regen
            var now = Date.now();
            var elapsed = Math.floor((now - (state.lastTick || now)) / 1000);
            if (elapsed > 0) {
                for (var j = 0; j < res.length; j++) {
                    var r = state[res[j]];
                    if (r.regenRate > 0 && r.current < r.max) {
                        var gained = Math.floor(elapsed / r.regenRate);
                        r.current = Math.min(r.current + gained, r.max);
                    }
                }
            }
            state.lastTick = now;

            // Purge expired cooldowns
            var cd = state.cooldowns;
            for (var key in cd) {
                if (cd.hasOwnProperty(key) && cd[key] <= now) {
                    delete cd[key];
                }
            }

            // Cap events at 100
            if (state.events.length > 100) {
                state.events = state.events.slice(-100);
            }

            saveState(state);
            return state;
        }

        function saveState(state) {
            state.lastTick = Date.now();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) { /* storage full, ignore */ }
        }

        function addEvent(state, tag, text) {
            var ev = { time: Date.now(), tag: tag, text: text };
            state.events.push(ev);
            if (state.events.length > 100) state.events = state.events.slice(-100);
            saveState(state);
            // Also append to DOM if event log exists
            var log = document.getElementById("system-log");
            if (log) {
                var empty = log.querySelector(".empty-log");
                if (empty) empty.remove();
                var d = new Date(ev.time);
                var ts = pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
                var div = _feedLine(ts, tag, tag.toUpperCase().slice(0, 3), text);
                log.appendChild(div);
                log.scrollTop = log.scrollHeight;
            }
            return ev;
        }

        function pad2(n) { return n < 10 ? "0" + n : "" + n; }

        // Expose globally for other modules
        window.FaultlineState = {
            load: loadState,
            save: saveState,
            addEvent: addEvent,
            pad2: pad2
        };
    })();

    // =====================================================
    //  Module 2: Resource Bar UI
    // =====================================================
    (function () {
        if (!document.getElementById("nerve-bar")) return;

        function formatTimer(resource, state) {
            var r = state[resource];
            if (!r || r.regenRate === 0) return "EARNED";
            if (r.current >= r.max) return "FULL";
            var now = Date.now();
            var elapsed = Math.floor((now - state.lastTick) / 1000);
            var sinceLastGain = elapsed % r.regenRate;
            var secsLeft = r.regenRate - sinceLastGain;
            var mins = Math.floor(secsLeft / 60);
            var secs = secsLeft % 60;
            return "next +1 in " + mins + ":" + FaultlineState.pad2(secs);
        }

        function updateBars() {
            var state = FaultlineState.load();
            var resources = ["nerve", "energy", "health", "rep"];
            for (var i = 0; i < resources.length; i++) {
                var key = resources[i];
                var r = state[key];
                var bar = document.getElementById(key + "-bar");
                var cur = document.getElementById(key + "-current");
                var max = document.getElementById(key + "-max");
                var timer = document.getElementById(key + "-timer");
                if (bar) {
                    var pct = r.max > 0 ? Math.round(r.current / r.max * 100) : 0;
                    // Round to nearest 5 for CSS data-width attribute (CSP blocks inline style)
                    var stepped = Math.round(pct / 5) * 5;
                    bar.setAttribute("data-width", String(stepped));
                }
                if (cur) cur.textContent = r.current;
                if (max) max.textContent = r.max;
                if (timer) timer.textContent = formatTimer(key, state);
            }
            var cred = document.getElementById("credits-display");
            if (cred) cred.textContent = "$" + state.credits.toLocaleString() + " CR";
        }

        updateBars();
        setInterval(updateBars, 1000);
    })();

    // =====================================================
    //  Module 3: Hacking Operations
    // =====================================================
    (function () {
        var hackOutput = document.getElementById("hack-output");
        if (!hackOutput) return;

        var HACKS = {
            portscan:    { name: "Port Scan",    nerveCost: 2,  cooldown: 15,  baseSuccess: 85, minReward: 50,   maxReward: 200,   repGain: 1, healthLoss: 5,  minRep: 0,  xp: 10 },
            bruteforce:  { name: "Brute Force",  nerveCost: 5,  cooldown: 30,  baseSuccess: 65, minReward: 150,  maxReward: 500,   repGain: 2, healthLoss: 10, minRep: 5,  xp: 20 },
            phishing:    { name: "Phishing",     nerveCost: 3,  cooldown: 20,  baseSuccess: 75, minReward: 80,   maxReward: 300,   repGain: 1, healthLoss: 8,  minRep: 0,  xp: 15 },
            ddos:        { name: "DDoS Attack",  nerveCost: 8,  cooldown: 45,  baseSuccess: 55, minReward: 300,  maxReward: 1000,  repGain: 3, healthLoss: 15, minRep: 15, xp: 30 },
            zeroday:     { name: "0day Exploit",  nerveCost: 10, cooldown: 60,  baseSuccess: 40, minReward: 500,  maxReward: 2000,  repGain: 5, healthLoss: 20, minRep: 25, xp: 40 },
            ransomware:  { name: "Ransomware",   nerveCost: 15, cooldown: 120, baseSuccess: 25, minReward: 1000, maxReward: 5000,  repGain: 8, healthLoss: 30, minRep: 40, xp: 50 }
        };

        var NETWORK_NODES = [
            { id: "n0",  label: "CORE-X1" },  { id: "n1",  label: "NEXUS-9" },
            { id: "n2",  label: "RELAY-88" }, { id: "n3",  label: "HUB-31" },
            { id: "n4",  label: "VAULT-13" }, { id: "n5",  label: "GRID-04" },
            { id: "n6",  label: "ARC-55" },   { id: "n7",  label: "SHARD-02" },
            { id: "n8",  label: "PROXY-6C" }, { id: "n9",  label: "NODE-7A2F" },
            { id: "n10", label: "CELL-42" },  { id: "n11", label: "LINK-17" },
            { id: "n12", label: "TOWER-09" }, { id: "n13", label: "GATE-77" },
            { id: "n14", label: "MESH-3D" }
        ];

        var SEQUENCES = {
            portscan: [
                "Initiating TCP SYN scan on {node}...",
                "Scanning ports 1-65535...",
                "Open ports found: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8080 (proxy)",
                "Fingerprinting services..."
            ],
            bruteforce: [
                "Loading credential wordlist (14.2M entries)...",
                "Attempting SSH bruteforce on {node}:22...",
                "Trying: admin:admin... FAILED",
                "Trying: root:toor... FAILED",
                "Trying: sysadmin:{pass}...",
                "Credential validation in progress..."
            ],
            phishing: [
                "Crafting spear-phishing payload...",
                "Spoofing sender: sysadmin@{node}.local",
                "Deploying credential harvester on port 8443...",
                "Waiting for target interaction..."
            ],
            ddos: [
                "Recruiting botnet nodes... 847 zombies online",
                "Targeting {node} on ports 80, 443, 8080...",
                "Launching volumetric flood: 12.4 Gbps...",
                "Target defense shields dropping...",
                "WAF bypass engaged..."
            ],
            zeroday: [
                "Analyzing {node} kernel version...",
                "CVE-2024-XXXXX: heap overflow in net_subsys",
                "Compiling exploit payload for target arch...",
                "Injecting shellcode via ROP chain...",
                "Privilege escalation in progress..."
            ],
            ransomware: [
                "Deploying loader via compromised update server...",
                "Enumerating file systems on {node}...",
                "Found 847GB of sensitive data",
                "Encrypting with AES-256-GCM...",
                "Encryption progress: [##########] 100%",
                "Dropping ransom note..."
            ]
        };

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function pad2(n) { return n < 10 ? "0" + n : "" + n; }

        function timestamp() {
            var d = new Date();
            return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
        }

        function appendLine(cls, text) {
            var div = _el("div", "hack-line");
            div.appendChild(_el("span", "feed-timestamp", timestamp()));
            div.appendChild(document.createTextNode(" "));
            div.appendChild(_el("span", cls, text));
            hackOutput.appendChild(div);
            while (hackOutput.children.length > 50) hackOutput.removeChild(hackOutput.firstChild);
            hackOutput.scrollTop = hackOutput.scrollHeight;
        }

        // --- Target Selector ---
        function getNodeOwner(nodeId, state) {
            if (state.territory && state.territory.indexOf(nodeId) !== -1) return "player";
            var hash = 0;
            for (var c = 0; c < nodeId.length; c++) hash = ((hash << 5) - hash) + nodeId.charCodeAt(c);
            var v = Math.abs(hash) % 10;
            if (v < 3) return "hostile";
            if (v < 4) return "contested";
            return "neutral";
        }

        function renderTargetSelector() {
            var list = document.getElementById("target-node-list");
            if (!list) return;
            var state = FaultlineState.load();
            _clearEl(list);
            var randBtn = _el("button", "target-node-option", "RANDOM");
            randBtn.setAttribute("data-target", "random");
            if (!state.selectedTarget || state.selectedTarget === "random") randBtn.setAttribute("data-selected", "true");
            list.appendChild(randBtn);
            for (var i = 0; i < NETWORK_NODES.length; i++) {
                var n = NETWORK_NODES[i];
                var owner = getNodeOwner(n.id, state);
                if (owner === "player") continue;
                var btn = _el("button", "target-node-option", n.label);
                btn.setAttribute("data-target", n.id);
                btn.setAttribute("data-owner", owner);
                if (state.selectedTarget === n.id) btn.setAttribute("data-selected", "true");
                list.appendChild(btn);
            }

            var nameEl = document.getElementById("selected-target-name");
            if (nameEl) {
                if (!state.selectedTarget || state.selectedTarget === "random") {
                    nameEl.textContent = "RANDOM";
                } else {
                    for (var j = 0; j < NETWORK_NODES.length; j++) {
                        if (NETWORK_NODES[j].id === state.selectedTarget) {
                            nameEl.textContent = NETWORK_NODES[j].label;
                            break;
                        }
                    }
                }
            }

            list.querySelectorAll(".target-node-option").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    var target = this.getAttribute("data-target");
                    var s = FaultlineState.load();
                    s.selectedTarget = target === "random" ? null : target;
                    FaultlineState.save(s);
                    renderTargetSelector();
                });
            });
        }

        renderTargetSelector();
        setInterval(renderTargetSelector, 5000);

        // Allow network map clicks to set target
        window.FaultlineTarget = {
            set: function (nodeId) {
                var state = FaultlineState.load();
                state.selectedTarget = nodeId;
                FaultlineState.save(state);
                renderTargetSelector();
            }
        };

        // --- Effective success rate calculation ---
        function getEffectiveSuccess(hack, state) {
            var rate = hack.baseSuccess;
            // Tool bonus
            var toolBonus = window.FaultlineMarket ? window.FaultlineMarket.getToolBonus(hack === HACKS.portscan ? "portscan" : "") : 0;
            // Find hack type key for tool bonus
            for (var key in HACKS) {
                if (HACKS[key] === hack) {
                    toolBonus = window.FaultlineMarket ? window.FaultlineMarket.getToolBonus(key) : 0;
                    break;
                }
            }
            rate += toolBonus;
            // Cracking stat: +2% per point
            var cracking = window.FaultlineStats ? window.FaultlineStats.get("cracking") : 1;
            rate += (cracking - 1) * 2;
            // Health penalty
            if (state.health.max > 0) {
                var hpPct = state.health.current / state.health.max * 100;
                if (hpPct < 30) rate -= 15;
                else if (hpPct < 50) rate -= 8;
            }
            // Target owner modifier
            var targetOwner = "neutral";
            if (state.selectedTarget) {
                targetOwner = getNodeOwner(state.selectedTarget, state);
            }
            if (targetOwner === "hostile") rate -= 10;
            else if (targetOwner === "contested") rate -= 5;
            // Merit bonuses
            if (window.FaultlineMerits) rate += window.FaultlineMerits.getEffect("hack_success");
            return Math.max(5, Math.min(95, rate));
        }

        function getEffectiveCooldown(hack) {
            var cd = hack.cooldown;
            var bw = window.FaultlineStats ? window.FaultlineStats.get("bandwidth") : 1;
            var reduction = Math.min(50, (bw - 1) * 2);
            if (window.FaultlineMerits) reduction += window.FaultlineMerits.getEffect("cooldown_reduction");
            reduction = Math.min(50, reduction);
            return Math.max(5, cd * (1 - reduction / 100));
        }

        var hackRunning = false;

        function runHackSequence(type) {
            if (hackRunning) return;
            var state = FaultlineState.load();
            var hack = HACKS[type];
            if (!hack) return;

            // Rep gate
            if (hack.minRep > 0 && state.rep.current < hack.minRep) {
                appendLine("term-error", "INSUFFICIENT REP (" + state.rep.current + "/" + hack.minRep + " required)");
                return;
            }

            // Check nerve
            if (state.nerve.current < hack.nerveCost) {
                appendLine("term-error", "INSUFFICIENT NERVE (" + state.nerve.current + "/" + hack.nerveCost + " required)");
                return;
            }

            // Check cooldown
            var now = Date.now();
            if (state.cooldowns[type] && state.cooldowns[type] > now) {
                var remaining = Math.ceil((state.cooldowns[type] - now) / 1000);
                appendLine("term-error", hack.name + " on cooldown: " + remaining + "s remaining");
                return;
            }

            // Deduct nerve & set cooldown (with bandwidth reduction)
            state.nerve.current -= hack.nerveCost;
            var effectiveCD = getEffectiveCooldown(hack);
            state.cooldowns[type] = now + (effectiveCD * 1000);
            state.totalOps++;
            FaultlineState.save(state);

            hackRunning = true;

            // Resolve target
            var targetNodeId = state.selectedTarget || null;
            var targetLabel;
            if (targetNodeId) {
                for (var i = 0; i < NETWORK_NODES.length; i++) {
                    if (NETWORK_NODES[i].id === targetNodeId) { targetLabel = NETWORK_NODES[i].label; break; }
                }
            }
            if (!targetLabel) {
                // Random target (exclude player-owned)
                var available = [];
                for (var j = 0; j < NETWORK_NODES.length; j++) {
                    if (getNodeOwner(NETWORK_NODES[j].id, state) !== "player") available.push(NETWORK_NODES[j]);
                }
                if (available.length === 0) available = NETWORK_NODES;
                var rn = pick(available);
                targetNodeId = rn.id;
                targetLabel = rn.label;
            }

            var lines = SEQUENCES[type].slice();
            var effectiveRate = getEffectiveSuccess(hack, state);
            var success = Math.random() * 100 < effectiveRate;

            // Target owner reward modifier
            var targetOwner = getNodeOwner(targetNodeId, state);
            var rewardMult = 1.0;
            if (targetOwner === "hostile") rewardMult = 1.5;
            else if (targetOwner === "contested") rewardMult = 1.25;

            // Replace placeholders
            for (var k = 0; k < lines.length; k++) {
                lines[k] = lines[k].replace(/\{node\}/g, targetLabel);
                lines[k] = lines[k].replace(/\{pass\}/g, "x" + randInt(1000, 9999) + "!");
            }

            appendLine("term-info", ">> EXECUTING: " + hack.name.toUpperCase() + " on " + targetLabel + " [" + Math.round(effectiveRate) + "%]");

            var lineIdx = 0;
            function typeLine() {
                if (lineIdx < lines.length) {
                    appendLine("term-response", lines[lineIdx]);
                    lineIdx++;
                    setTimeout(typeLine, randInt(300, 600));
                } else {
                    setTimeout(function () {
                        state = FaultlineState.load();
                        if (success) {
                            var reward = Math.round(randInt(hack.minReward, hack.maxReward) * rewardMult);
                            // Cracking reward scaling
                            var cracking = window.FaultlineStats ? window.FaultlineStats.get("cracking") : 1;
                            reward = Math.round(reward * (1 + (cracking - 1) * 0.02));
                            state.credits += reward;
                            state.rep.current = Math.min(state.rep.current + hack.repGain, state.rep.max);
                            appendLine("term-success", "SUCCESS — +" + reward + " CR, +" + hack.repGain + " REP");
                            FaultlineState.addEvent(state, "heist", hack.name + " succeeded on " + targetLabel + " +" + reward + "cr");
                            // Capture the targeted node
                            if (!state.territory) state.territory = [];
                            if (state.territory.indexOf(targetNodeId) === -1 && state.territory.length < 15) {
                                state.territory.push(targetNodeId);
                                FaultlineState.addEvent(state, "heist", "Node " + targetLabel + " captured!");
                            }
                            FaultlineState.save(state);
                            if (window.FaultlineNetwork) window.FaultlineNetwork.rebuild();
                            // XP
                            if (window.FaultlineLevel) window.FaultlineLevel.addXP(state, hack.xp, "hack");
                        } else {
                            // Stealth reduces health loss
                            var stealth = window.FaultlineStats ? window.FaultlineStats.get("stealth") : 1;
                            var reduction = Math.min(0.5, (stealth - 1) * 0.03);
                            var loss = Math.round(hack.healthLoss * (1 - reduction));
                            loss = Math.min(loss, state.health.current);
                            state.health.current -= loss;
                            appendLine("term-error", "FAILED — TRACED! -" + loss + " integrity");
                            FaultlineState.addEvent(state, "alert", hack.name + " failed on " + targetLabel + " -" + loss + " integrity");
                            FaultlineState.save(state);
                        }
                        hackRunning = false;
                        renderTargetSelector();
                    }, 400);
                }
            }
            setTimeout(typeLine, 400);
        }

        // Bind click handlers to hack buttons
        document.querySelectorAll(".hack-op-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                runHackSequence(this.getAttribute("data-hack"));
            });
        });

        // Cooldown tick — update button states and timer text
        function updateCooldowns() {
            var state = FaultlineState.load();
            var now = Date.now();
            document.querySelectorAll(".hack-op-btn").forEach(function (btn) {
                var type = btn.getAttribute("data-hack");
                var cdEl = document.getElementById("cd-" + type);
                var hack = HACKS[type];
                if (state.cooldowns[type] && state.cooldowns[type] > now) {
                    var secs = Math.ceil((state.cooldowns[type] - now) / 1000);
                    btn.disabled = true;
                    if (cdEl) cdEl.textContent = secs + "s";
                } else {
                    var blocked = hackRunning || (hack && state.nerve.current < hack.nerveCost);
                    if (!blocked && hack && hack.minRep > 0 && state.rep.current < hack.minRep) blocked = true;
                    btn.disabled = blocked;
                    if (cdEl) {
                        // Show effective success rate
                        if (hack) {
                            var eff = getEffectiveSuccess(hack, state);
                            cdEl.textContent = Math.round(eff) + "%";
                        } else {
                            cdEl.textContent = "";
                        }
                    }
                }
            });

            // Update cooldown panel
            var panel = document.getElementById("cooldown-panel");
            if (panel) {
                _clearEl(panel);
                var hasActive = false;
                for (var key in HACKS) {
                    if (HACKS.hasOwnProperty(key) && state.cooldowns[key] && state.cooldowns[key] > now) {
                        hasActive = true;
                        var remaining = Math.ceil((state.cooldowns[key] - now) / 1000);
                        var mins = Math.floor(remaining / 60);
                        var s = remaining % 60;
                        var card = _el("div", "cooldown-card");
                        card.appendChild(_el("span", "cd-name", HACKS[key].name));
                        card.appendChild(_el("span", "cd-timer", mins + ":" + pad2(s)));
                        panel.appendChild(card);
                    }
                }
                // Also show training cooldown
                if (state.lastTrainTime) {
                    var trainLeft = 60000 - (now - state.lastTrainTime);
                    if (trainLeft > 0) {
                        hasActive = true;
                        var ts = Math.ceil(trainLeft / 1000);
                        var tCard = _el("div", "cooldown-card");
                        tCard.appendChild(_el("span", "cd-name", "Training"));
                        tCard.appendChild(_el("span", "cd-timer", "0:" + pad2(ts)));
                        panel.appendChild(tCard);
                    }
                }
                if (!hasActive) panel.appendChild(_el("div", "empty-log", "No active cooldowns."));
            }
        }

        updateCooldowns();
        setInterval(updateCooldowns, 1000);
    })();

    // =====================================================
    //  Module 4: Guest Demo Terminal
    // =====================================================
    (function () {
        var input = document.getElementById("demo-terminal-input");
        var output = document.getElementById("demo-terminal-output");
        if (!input || !output) return;

        var history = [];
        var historyIdx = -1;
        var nodes = ["NODE-7A2F", "GRID-04", "NEXUS-9", "VAULT-13", "RELAY-88", "CORE-X1", "ARC-55", "SHARD-02"];
        var typing = false;

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

        function appendLine(cls, text) {
            var div = document.createElement("div");
            div.className = cls;
            div.textContent = text;
            output.appendChild(div);
            output.scrollTop = output.scrollHeight;
        }

        function typeLines(lines, delay, callback) {
            typing = true;
            var i = 0;
            function next() {
                if (i < lines.length) {
                    appendLine(lines[i][0], lines[i][1]);
                    i++;
                    setTimeout(next, delay || 300);
                } else {
                    typing = false;
                    if (callback) callback();
                }
            }
            next();
        }

        var commands = {
            help: function () {
                typeLines([
                    ["term-info", "Available commands:"],
                    ["term-response", "  scan       — Discover nodes on the network"],
                    ["term-response", "  hack NODE  — Attempt to breach a discovered node"],
                    ["term-response", "  status     — Show your operative stats"],
                    ["term-response", "  who        — List operatives online"],
                    ["term-response", "  about      — About FAULTLINE"],
                    ["term-response", "  clear      — Clear terminal"]
                ], 100);
            },
            scan: function () {
                var discovered = [];
                for (var i = 0; i < randInt(3, 5); i++) {
                    var n = pick(nodes);
                    if (discovered.indexOf(n) === -1) discovered.push(n);
                }
                var lines = [["term-info", "Scanning subnet 10.0.42.0/24..."]];
                for (var j = 0; j < discovered.length; j++) {
                    lines.push(["term-success", "  [+] " + discovered[j] + " — port " + pick(["22", "80", "443", "3306", "8080"]) + " open"]);
                }
                lines.push(["term-info", discovered.length + " node(s) discovered. Use: hack <NODE-ID>"]);
                typeLines(lines, 350);
            },
            hack: function (args) {
                var target = args[0] || pick(nodes);
                typeLines([
                    ["term-info", "Targeting " + target + "..."],
                    ["term-response", "Establishing covert channel..."],
                    ["term-response", "Bypassing firewall rules..."],
                    ["term-response", "Injecting payload..."],
                    ["term-success", "ACCESS GRANTED — " + randInt(200, 2000) + " credits extracted"],
                    ["term-info", "Jack in to keep your earnings: /api/auth/oidc/authorize"]
                ], 500);
            },
            status: function () {
                typeLines([
                    ["term-info", "=== OPERATIVE STATUS ==="],
                    ["term-response", "  Handle:    guest_" + randInt(1000, 9999)],
                    ["term-response", "  Credits:   0 (sign in to earn)"],
                    ["term-response", "  Nerve:     50/50"],
                    ["term-response", "  Integrity: 100/100"],
                    ["term-response", "  Rep:       0/100"],
                    ["term-info", "========================"]
                ], 100);
            },
            who: function () {
                var names = ["gh0st", "cipher", "n0va", "bl4ckout", "sp3ctr3", "z3r0day", "phantom", "v1per", "neon", "glitch"];
                var online = [];
                for (var i = 0; i < randInt(4, 7); i++) {
                    var n = pick(names);
                    if (online.indexOf(n) === -1) online.push(n);
                }
                var lines = [["term-info", online.length + " operatives online:"]];
                for (var j = 0; j < online.length; j++) {
                    lines.push(["term-response", "  " + online[j] + " — " + pick(["idle", "hacking", "trading", "recruiting", "raiding"])]);
                }
                typeLines(lines, 150);
            },
            about: function () {
                typeLines([
                    ["term-info", "FAULTLINE v0.1.0"],
                    ["term-response", "A text-based hacker RPG."],
                    ["term-response", "Form syndicates. Run operations. Control territory."],
                    ["term-response", "Exploit every faultline in the network."],
                    ["term-info", "Built with Rust + Loco + OIDC"]
                ], 150);
            },
            clear: function () {
                _clearEl(output);
                output.appendChild(_el("div", "term-info", "Terminal cleared."));
            }
        };

        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                var raw = input.value.trim();
                input.value = "";
                if (!raw || typing) return;
                history.push(raw);
                historyIdx = history.length;
                appendLine("term-cmd", "$ " + raw);
                var parts = raw.split(/\s+/);
                var cmd = parts[0].toLowerCase();
                var args = parts.slice(1);
                if (commands[cmd]) {
                    commands[cmd](args);
                } else {
                    appendLine("term-error", "Unknown command: " + cmd + ". Type 'help' for available commands.");
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (historyIdx > 0) {
                    historyIdx--;
                    input.value = history[historyIdx];
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (historyIdx < history.length - 1) {
                    historyIdx++;
                    input.value = history[historyIdx];
                } else {
                    historyIdx = history.length;
                    input.value = "";
                }
            }
        });

        // Auto-focus the terminal input when clicking the terminal
        output.parentElement.addEventListener("click", function () {
            input.focus();
        });
    })();

    // =====================================================
    //  Module 5: Event Log + Cooldown Panel (init)
    // =====================================================
    (function () {
        var log = document.getElementById("system-log");
        if (!log) return;

        function pad2(n) { return n < 10 ? "0" + n : "" + n; }

        var state = FaultlineState.load();
        if (state.events.length > 0) {
            _clearEl(log);
            var start = Math.max(0, state.events.length - 50);
            for (var i = start; i < state.events.length; i++) {
                var ev = state.events[i];
                var d = new Date(ev.time);
                var ts = pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
                log.appendChild(_feedLine(ts, ev.tag, ev.tag.toUpperCase().slice(0, 3), ev.text));
            }
            log.scrollTop = log.scrollHeight;
        }
    })();

    // =====================================================
    //  Module 6: Syndicate Wars
    // =====================================================
    (function () {
        var syndicateList = document.getElementById("syndicate-list");
        var attackLogEl = document.getElementById("attack-log");
        if (!syndicateList || !attackLogEl) return;

        var RIVALS = [
            { id: "phantom_collective", name: "PHANTOM COLLECTIVE", power: 15, territories: 3 },
            { id: "neon_wolves",        name: "NEON WOLVES",        power: 22, territories: 4 },
            { id: "dead_channel",       name: "DEAD CHANNEL",       power: 35, territories: 5 },
            { id: "zero_division",      name: "ZERO DIVISION",      power: 50, territories: 6 },
            { id: "iron_grid",          name: "IRON GRID",          power: 45, territories: 5 },
            { id: "dark_signal",        name: "DARK SIGNAL",        power: 60, territories: 7 },
            { id: "byte_cartel",        name: "BYTE CARTEL",        power: 75, territories: 8 }
        ];

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        function getPlayerPower(state) {
            return 10 + state.rep.current + Math.floor(state.totalOps / 5);
        }

        function getDefenseRating(state) {
            var base = Math.floor(state.rep.current * 1.2);
            var fw = window.FaultlineStats ? window.FaultlineStats.get("firewall") : 1;
            return base + (fw - 1) * 3;
        }

        function appendWarLog(cls, text) {
            var d = new Date();
            var ts = FaultlineState.pad2(d.getHours()) + ":" + FaultlineState.pad2(d.getMinutes()) + ":" + FaultlineState.pad2(d.getSeconds());
            var div = _el("div", "hack-line");
            div.appendChild(_el("span", "feed-timestamp", ts));
            div.appendChild(document.createTextNode(" "));
            div.appendChild(_el("span", cls, text));
            attackLogEl.appendChild(div);
            while (attackLogEl.children.length > 30) attackLogEl.removeChild(attackLogEl.firstChild);
            attackLogEl.scrollTop = attackLogEl.scrollHeight;
        }

        function renderSyndicates() {
            var state = FaultlineState.load();
            var now = Date.now();
            var canAttack = state.energy.current >= 20 && state.nerve.current >= 5 &&
                           (!state.attackCooldown || state.attackCooldown <= now);
            _clearEl(syndicateList);
            for (var i = 0; i < RIVALS.length; i++) {
                var s = RIVALS[i];
                var card = _el("div", "syndicate-card");
                var info = _el("div", "syndicate-card-info");
                info.appendChild(_el("span", "syndicate-card-name", s.name));
                var stats = _el("div", "syndicate-card-stats");
                stats.appendChild(_el("span", "cyber-badge cyber-badge--sm", "PWR " + s.power));
                stats.appendChild(_el("span", "cyber-badge cyber-badge--sm", "TERR " + s.territories));
                info.appendChild(stats);
                card.appendChild(info);
                var atkBtn = _el("button", "cyber-btn cyber-btn--sm attack-btn", "ATTACK");
                atkBtn.setAttribute("data-syndicate", s.id);
                if (!canAttack) atkBtn.disabled = true;
                card.appendChild(atkBtn);
                syndicateList.appendChild(card);
            }

            var defEl = document.getElementById("defense-rating");
            if (defEl) defEl.textContent = getDefenseRating(state);
            var terrEl = document.getElementById("territory-count");
            if (terrEl) terrEl.textContent = (state.territory ? state.territory.length : 0) + " / 15";

            syndicateList.querySelectorAll(".attack-btn").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    attackSyndicate(this.getAttribute("data-syndicate"));
                });
            });
        }

        function attackSyndicate(syndicateId) {
            var state = FaultlineState.load();
            var target = null;
            for (var i = 0; i < RIVALS.length; i++) {
                if (RIVALS[i].id === syndicateId) { target = RIVALS[i]; break; }
            }
            if (!target) return;
            if (state.energy.current < 20 || state.nerve.current < 5) {
                appendWarLog("term-error", "INSUFFICIENT RESOURCES");
                return;
            }

            state.energy.current -= 20;
            state.nerve.current -= 5;
            state.attackCooldown = Date.now() + 30000;

            var playerPower = getPlayerPower(state);
            var successChance = Math.max(10, Math.min(90, 50 + (playerPower - target.power) * 2));
            var success = Math.random() * 100 < successChance;

            if (success) {
                var reward = randInt(100, 500) + target.power * 5;
                state.credits += reward;
                state.rep.current = Math.min(state.rep.current + 2, state.rep.max);
                if (target.territories > 0) target.territories--;
                appendWarLog("term-success", "RAID on " + target.name + " SUCCEEDED! +" + reward + " CR");
                FaultlineState.addEvent(state, "syndicate", "Raided " + target.name + " +" + reward + "cr");
                if (window.FaultlineNetwork) window.FaultlineNetwork.captureRandomNode();
                if (window.FaultlineLevel) window.FaultlineLevel.addXP(state, randInt(15, 40), "syndicate");
            } else {
                var stealth = window.FaultlineStats ? window.FaultlineStats.get("stealth") : 1;
                var dmgReduce = Math.min(0.5, (stealth - 1) * 0.03);
                var hpLoss = Math.round(randInt(10, 25) * (1 - dmgReduce));
                var crLoss = randInt(50, 200);
                state.health.current = Math.max(0, state.health.current - hpLoss);
                state.credits = Math.max(0, state.credits - crLoss);
                appendWarLog("term-error", "RAID on " + target.name + " FAILED! -" + hpLoss + " HP -" + crLoss + " CR");
                FaultlineState.addEvent(state, "alert", "Failed raid on " + target.name);
            }
            FaultlineState.save(state);
            renderSyndicates();
        }

        renderSyndicates();
        setInterval(renderSyndicates, 5000);

        // Passive defense — enemy raids
        setTimeout(function defenseLoop() {
            var state = FaultlineState.load();
            var attacker = RIVALS[Math.floor(Math.random() * RIVALS.length)];
            var defended = Math.random() * 100 < Math.min(80, 30 + getDefenseRating(state));
            if (defended) {
                appendWarLog("term-info", attacker.name + " attempted raid -- DEFENDED");
                FaultlineState.addEvent(state, "alert", "Repelled " + attacker.name);
            } else {
                var loss = randInt(20, 80);
                state.credits = Math.max(0, state.credits - loss);
                appendWarLog("term-error", attacker.name + " raided you! -" + loss + " CR");
                FaultlineState.addEvent(state, "breach", attacker.name + " stole " + loss + "cr");
                FaultlineState.save(state);
            }
            setTimeout(defenseLoop, randInt(60000, 120000));
        }, randInt(30000, 60000));
    })();

    // =====================================================
    //  Module 7: Black Market
    // =====================================================
    (function () {
        var upgradeList = document.getElementById("upgrades-grid");
        var toolList = document.getElementById("tools-grid");
        var inventoryList = document.getElementById("inventory-grid");
        if (!upgradeList) return;

        var UPGRADES = [
            { id: "nerve_max",    name: "+10 Max Nerve",     desc: "Expand neural capacity",   resource: "nerve",  field: "max",       amount: 10, basePrice: 300,  scale: 1.5 },
            { id: "energy_max",   name: "+20 Max CPU",       desc: "Overclock processors",     resource: "energy", field: "max",       amount: 20, basePrice: 400,  scale: 1.5 },
            { id: "health_max",   name: "+20 Max Integrity", desc: "Harden defenses",          resource: "health", field: "max",       amount: 20, basePrice: 350,  scale: 1.5 },
            { id: "nerve_regen",  name: "Nerve Regen +",     desc: "Faster nerve recovery",    resource: "nerve",  field: "regenRate", amount: -30, basePrice: 500,  scale: 1.8 },
            { id: "energy_regen", name: "CPU Regen +",       desc: "Faster CPU recovery",      resource: "energy", field: "regenRate", amount: -60, basePrice: 600,  scale: 1.8 },
            { id: "health_regen", name: "Integrity Regen +", desc: "Faster repair cycle",      resource: "health", field: "regenRate", amount: -18, basePrice: 450,  scale: 1.8 }
        ];

        var TOOLS = [
            { id: "tool_rootkit",    name: "ROOTKIT",     desc: "+5% all hacks",       bonus: 5,  hackType: "all",        basePrice: 800 },
            { id: "tool_keylogger",  name: "KEYLOGGER",   desc: "+10% phishing",       bonus: 10, hackType: "phishing",   basePrice: 400 },
            { id: "tool_botnet",     name: "BOTNET",      desc: "+10% DDoS",           bonus: 10, hackType: "ddos",       basePrice: 600 },
            { id: "tool_crypter",    name: "CRYPTER",     desc: "+10% ransomware",     bonus: 10, hackType: "ransomware", basePrice: 1000 },
            { id: "tool_scanner",    name: "ADV SCANNER", desc: "+10% port scan",      bonus: 10, hackType: "portscan",   basePrice: 250 },
            { id: "tool_exploit_db", name: "EXPLOIT DB",  desc: "+8% 0day",            bonus: 8,  hackType: "zeroday",    basePrice: 1200 }
        ];

        function getPrice(item, state) {
            var count = (state.purchases && state.purchases[item.id]) || 0;
            return Math.floor(item.basePrice * Math.pow(item.scale || 1.3, count));
        }

        function _marketItem(attrName, attrVal, canBuy, name, desc, price, count) {
            var item = _el("div", "market-item");
            item.setAttribute(attrName, attrVal);
            if (!canBuy) item.setAttribute("data-disabled", "true");
            item.appendChild(_el("span", "market-item-name", name));
            item.appendChild(_el("span", "market-item-desc", desc));
            var row = _el("div", "cyber-flex cyber-justify-between");
            row.appendChild(_el("span", "market-item-price", price + " CR"));
            row.appendChild(_el("span", "market-item-owned", "x" + count));
            item.appendChild(row);
            return item;
        }

        function renderMarket() {
            var state = FaultlineState.load();
            _clearEl(upgradeList);
            for (var i = 0; i < UPGRADES.length; i++) {
                var u = UPGRADES[i];
                var price = getPrice(u, state);
                var count = (state.purchases && state.purchases[u.id]) || 0;
                var canBuy = state.credits >= price;
                if (u.field === "regenRate" && state[u.resource].regenRate + u.amount < 30) canBuy = false;
                var item = _marketItem("data-upgrade", u.id, canBuy, u.name, u.desc, price, count);
                item.addEventListener("click", (function (uid) {
                    return function () {
                        if (this.getAttribute("data-disabled") === "true") return;
                        buyUpgrade(uid);
                    };
                })(u.id));
                upgradeList.appendChild(item);
            }

            _clearEl(toolList);
            for (var j = 0; j < TOOLS.length; j++) {
                var t = TOOLS[j];
                var tCount = (state.purchases && state.purchases[t.id]) || 0;
                var tPrice = Math.floor(t.basePrice * Math.pow(1.3, tCount));
                var tCanBuy = state.credits >= tPrice;
                var tItem = _marketItem("data-tool", t.id, tCanBuy, t.name, t.desc, tPrice, tCount);
                tItem.addEventListener("click", (function (tid) {
                    return function () {
                        if (this.getAttribute("data-disabled") === "true") return;
                        buyTool(tid);
                    };
                })(t.id));
                toolList.appendChild(tItem);
            }

            // Inventory with sell buttons
            _clearEl(inventoryList);
            if (!state.inventory || state.inventory.length === 0) {
                inventoryList.appendChild(_el("p", "cyber-text-muted cyber-mono", "No items yet."));
            } else {
                var counts = {};
                for (var k = 0; k < state.inventory.length; k++) {
                    counts[state.inventory[k]] = (counts[state.inventory[k]] || 0) + 1;
                }
                for (var itemName in counts) {
                    if (counts.hasOwnProperty(itemName)) {
                        var sellPrice = 0;
                        for (var sp = 0; sp < TOOLS.length; sp++) {
                            if (TOOLS[sp].name === itemName) { sellPrice = Math.floor(TOOLS[sp].basePrice * 0.6); break; }
                        }
                        var sellDiscount = window.FaultlineMerits ? window.FaultlineMerits.getEffect("sell_bonus") : 0;
                        sellPrice = Math.round(sellPrice * (1 + sellDiscount / 100));
                        var label = itemName + (counts[itemName] > 1 ? " x" + counts[itemName] : "") +
                                    (sellPrice > 0 ? " [" + sellPrice + "cr]" : "");
                        var invItem = _el("span", "inventory-item", label);
                        invItem.setAttribute("data-sell", itemName);
                        invItem.addEventListener("click", (function (n) {
                            return function () { sellItem(n); };
                        })(itemName));
                        inventoryList.appendChild(invItem);
                    }
                }
            }

            var mc = document.getElementById("market-credits");
            if (mc) mc.textContent = "$" + state.credits.toLocaleString() + " CR";
        }

        function buyUpgrade(upgradeId) {
            var state = FaultlineState.load();
            var upgrade = null;
            for (var i = 0; i < UPGRADES.length; i++) {
                if (UPGRADES[i].id === upgradeId) { upgrade = UPGRADES[i]; break; }
            }
            if (!upgrade) return;
            var price = getPrice(upgrade, state);
            if (state.credits < price) return;
            state.credits -= price;
            if (!state.purchases) state.purchases = {};
            state.purchases[upgradeId] = (state.purchases[upgradeId] || 0) + 1;
            state[upgrade.resource][upgrade.field] += upgrade.amount;
            if (upgrade.field === "max") state[upgrade.resource].current += upgrade.amount;
            FaultlineState.save(state);
            FaultlineState.addEvent(state, "system", "Purchased " + upgrade.name + " for " + price + " CR");
            if (window.FaultlineLevel) window.FaultlineLevel.addXP(state, 5, "market");
            renderMarket();
        }

        function buyTool(toolId) {
            var state = FaultlineState.load();
            var tool = null;
            for (var i = 0; i < TOOLS.length; i++) {
                if (TOOLS[i].id === toolId) { tool = TOOLS[i]; break; }
            }
            if (!tool) return;
            var count = (state.purchases && state.purchases[toolId]) || 0;
            var price = Math.floor(tool.basePrice * Math.pow(1.3, count));
            if (state.credits < price) return;
            state.credits -= price;
            if (!state.purchases) state.purchases = {};
            state.purchases[toolId] = (state.purchases[toolId] || 0) + 1;
            if (!state.inventory) state.inventory = [];
            state.inventory.push(tool.name);
            FaultlineState.save(state);
            FaultlineState.addEvent(state, "heist", "Acquired " + tool.name + " on black market");
            if (window.FaultlineLevel) window.FaultlineLevel.addXP(state, 5, "market");
            renderMarket();
        }

        function sellItem(itemName) {
            var state = FaultlineState.load();
            if (!state.inventory) return;
            var idx = state.inventory.indexOf(itemName);
            if (idx === -1) return;
            var sellPrice = 0;
            for (var i = 0; i < TOOLS.length; i++) {
                if (TOOLS[i].name === itemName) { sellPrice = Math.floor(TOOLS[i].basePrice * 0.6); break; }
            }
            var sellBonus = window.FaultlineMerits ? window.FaultlineMerits.getEffect("sell_bonus") : 0;
            sellPrice = Math.round(sellPrice * (1 + sellBonus / 100));
            if (sellPrice <= 0) return;
            state.inventory.splice(idx, 1);
            state.credits += sellPrice;
            FaultlineState.save(state);
            FaultlineState.addEvent(state, "system", "Sold " + itemName + " for " + sellPrice + " CR");
            renderMarket();
        }

        window.FaultlineMarket = {
            getToolBonus: function (hackType) {
                var state = FaultlineState.load();
                var bonus = 0;
                for (var i = 0; i < TOOLS.length; i++) {
                    var t = TOOLS[i];
                    var count = (state.purchases && state.purchases[t.id]) || 0;
                    if (count > 0 && (t.hackType === hackType || t.hackType === "all")) {
                        bonus += t.bonus * count;
                    }
                }
                return bonus;
            }
        };

        renderMarket();
        setInterval(renderMarket, 2000);
    })();

    // =====================================================
    //  Module 8: Network Map (SVG)
    // =====================================================
    (function () {
        var container = document.getElementById("network-map");
        if (!container) return;

        var NODES = [
            { id: "n0",  label: "CORE-X1",   x: 50, y: 12 },
            { id: "n1",  label: "NEXUS-9",   x: 25, y: 25 },
            { id: "n2",  label: "RELAY-88",  x: 75, y: 25 },
            { id: "n3",  label: "HUB-31",    x: 12, y: 42 },
            { id: "n4",  label: "VAULT-13",  x: 38, y: 38 },
            { id: "n5",  label: "GRID-04",   x: 62, y: 38 },
            { id: "n6",  label: "ARC-55",    x: 88, y: 42 },
            { id: "n7",  label: "SHARD-02",  x: 20, y: 58 },
            { id: "n8",  label: "PROXY-6C",  x: 50, y: 55 },
            { id: "n9",  label: "NODE-7A2F", x: 80, y: 58 },
            { id: "n10", label: "CELL-42",   x: 10, y: 75 },
            { id: "n11", label: "LINK-17",   x: 35, y: 72 },
            { id: "n12", label: "TOWER-09",  x: 55, y: 75 },
            { id: "n13", label: "GATE-77",   x: 75, y: 75 },
            { id: "n14", label: "MESH-3D",   x: 50, y: 90 }
        ];

        var EDGES = [
            ["n0","n1"], ["n0","n2"], ["n1","n3"], ["n1","n4"], ["n2","n5"], ["n2","n6"],
            ["n3","n7"], ["n4","n8"], ["n5","n8"], ["n6","n9"], ["n7","n10"], ["n7","n11"],
            ["n8","n11"], ["n8","n12"], ["n9","n13"], ["n10","n14"], ["n11","n14"],
            ["n12","n14"], ["n13","n14"], ["n4","n5"], ["n3","n4"], ["n5","n6"]
        ];

        function findNode(id) {
            for (var i = 0; i < NODES.length; i++) {
                if (NODES[i].id === id) return NODES[i];
            }
            return null;
        }

        function getNodeOwner(nodeId, state) {
            if (state.territory && state.territory.indexOf(nodeId) !== -1) return "player";
            var hash = 0;
            for (var c = 0; c < nodeId.length; c++) hash = ((hash << 5) - hash) + nodeId.charCodeAt(c);
            var v = Math.abs(hash) % 10;
            if (v < 3) return "hostile";
            if (v < 4) return "contested";
            return "neutral";
        }

        function buildSVG() {
            var state = FaultlineState.load();
            if (!state.territory) state.territory = [];
            var svgNS = "http://www.w3.org/2000/svg";
            var svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

            for (var e = 0; e < EDGES.length; e++) {
                var from = findNode(EDGES[e][0]);
                var to = findNode(EDGES[e][1]);
                if (!from || !to) continue;
                var line = document.createElementNS(svgNS, "line");
                line.setAttribute("x1", from.x);
                line.setAttribute("y1", from.y);
                line.setAttribute("x2", to.x);
                line.setAttribute("y2", to.y);
                line.setAttribute("class", "net-edge");
                svg.appendChild(line);
            }

            for (var i = 0; i < NODES.length; i++) {
                var n = NODES[i];
                var owner = getNodeOwner(n.id, state);
                var circle = document.createElementNS(svgNS, "circle");
                circle.setAttribute("cx", n.x);
                circle.setAttribute("cy", n.y);
                circle.setAttribute("r", "3");
                circle.setAttribute("class", "net-node");
                circle.setAttribute("data-node-id", n.id);
                circle.setAttribute("data-owner", owner);
                circle.setAttribute("data-label", n.label);
                svg.appendChild(circle);

                var text = document.createElementNS(svgNS, "text");
                text.setAttribute("x", n.x);
                text.setAttribute("y", String(n.y + 5.5));
                text.setAttribute("class", "net-node-label");
                text.setAttribute("text-anchor", "middle");
                text.textContent = n.label;
                svg.appendChild(text);
            }

            _clearEl(container);
            container.appendChild(svg);

            svg.addEventListener("click", function (e) {
                var node = e.target;
                if (!node.classList || !node.classList.contains("net-node")) return;
                showNodeInfo(node.getAttribute("data-node-id"), node.getAttribute("data-label"), node.getAttribute("data-owner"));
            });

            var sumEl = document.getElementById("territory-header");
            if (sumEl) sumEl.textContent = (state.territory ? state.territory.length : 0) + "/15 owned";
        }

        function showNodeInfo(nodeId, label, owner) {
            var panel = document.getElementById("node-info-panel");
            var nameEl = document.getElementById("node-info-name");
            var detailEl = document.getElementById("node-info-detail");
            var actionBtn = document.getElementById("node-info-action");
            if (!panel) return;
            var hint = document.getElementById("node-info-hint");
            if (hint) hint.classList.add("node-info-hidden");
            panel.classList.remove("node-info-hidden");
            nameEl.textContent = label;
            var ownerText = { player: "OWNED", hostile: "HOSTILE", neutral: "NEUTRAL", contested: "CONTESTED" };
            detailEl.textContent = ownerText[owner] || owner;
            // Set as hack target
            if (owner !== "player" && window.FaultlineTarget) {
                window.FaultlineTarget.set(nodeId);
            }
            if (owner === "player") {
                actionBtn.textContent = "OWNED";
                actionBtn.disabled = true;
            } else {
                actionBtn.textContent = "TARGET";
                actionBtn.disabled = false;
                actionBtn.onclick = function () { hackNode(nodeId); };
            }
        }

        function hackNode(nodeId) {
            var state = FaultlineState.load();
            if (state.nerve.current < 3) {
                FaultlineState.addEvent(state, "alert", "Insufficient nerve to hack node");
                return;
            }
            state.nerve.current -= 3;
            var n = findNode(nodeId);
            var success = Math.random() < 0.5 + (state.rep.current / 200);
            if (success) {
                if (!state.territory) state.territory = [];
                if (state.territory.indexOf(nodeId) === -1) state.territory.push(nodeId);
                FaultlineState.addEvent(state, "heist", "Captured " + (n ? n.label : nodeId));
            } else {
                state.health.current = Math.max(0, state.health.current - 5);
                FaultlineState.addEvent(state, "alert", "Failed to capture " + (n ? n.label : nodeId));
            }
            FaultlineState.save(state);
            buildSVG();
        }

        window.FaultlineNetwork = {
            captureRandomNode: function () {
                var state = FaultlineState.load();
                if (!state.territory) state.territory = [];
                if (state.territory.length >= 15) return;
                var available = [];
                for (var i = 0; i < NODES.length; i++) {
                    if (state.territory.indexOf(NODES[i].id) === -1) available.push(NODES[i].id);
                }
                if (available.length === 0) return;
                var pick = available[Math.floor(Math.random() * available.length)];
                state.territory.push(pick);
                FaultlineState.save(state);
                var n = findNode(pick);
                FaultlineState.addEvent(state, "heist", "Node " + (n ? n.label : pick) + " captured!");
                buildSVG();
            },
            rebuild: buildSVG
        };

        buildSVG();
        setInterval(buildSVG, 10000);
    })();

    // =====================================================
    //  Module 9: Leveling & XP System
    // =====================================================
    (function () {
        var xpBar = document.getElementById("xp-bar");
        if (!xpBar) return;

        function xpForLevel(lvl) { return lvl * 100; }

        function ensureLevelState(state) {
            if (state.level === undefined) state.level = 1;
            if (state.xp === undefined) state.xp = 0;
            if (state.exploitPoints === undefined) state.exploitPoints = 0;
        }

        function addXP(state, amount, source) {
            ensureLevelState(state);
            if (state.level >= 100) return;
            state.xp += amount;
            var leveled = false;
            while (state.level < 100 && state.xp >= xpForLevel(state.level)) {
                state.xp -= xpForLevel(state.level);
                state.level++;
                state.exploitPoints++;
                leveled = true;
                FaultlineState.addEvent(state, "system", "LEVEL UP! Now level " + state.level + " (+1 Exploit Point)");
            }
            if (state.level >= 100) state.xp = 0;
            FaultlineState.save(state);
            if (!leveled && source) {
                // silent XP gain, no event
            }
            updateXPDisplay(state);
        }

        function updateXPDisplay(state) {
            ensureLevelState(state);
            var lvlEl = document.getElementById("level-display");
            var labelEl = document.getElementById("xp-label");
            var valsEl = document.getElementById("xp-values");
            var needed = xpForLevel(state.level);
            var pct = needed > 0 ? Math.round(state.xp / needed * 100) : 100;
            var stepped = Math.round(pct / 5) * 5;
            xpBar.setAttribute("data-width", String(stepped));
            if (lvlEl) lvlEl.textContent = state.level;
            if (labelEl) labelEl.textContent = "LVL " + state.level;
            if (valsEl) valsEl.textContent = state.xp + " / " + needed + " XP";
            var epEl = document.getElementById("exploit-points-display");
            if (epEl) epEl.textContent = state.exploitPoints + " EP";
        }

        // Init display
        var state = FaultlineState.load();
        ensureLevelState(state);
        FaultlineState.save(state);
        updateXPDisplay(state);
        setInterval(function () { updateXPDisplay(FaultlineState.load()); }, 2000);

        window.FaultlineLevel = {
            addXP: addXP,
            update: function () { updateXPDisplay(FaultlineState.load()); }
        };
    })();

    // =====================================================
    //  Module 10: Player Stats & Training
    // =====================================================
    (function () {
        var statsGrid = document.getElementById("stat-cracking");
        if (!statsGrid) return;

        var STATS = ["cracking", "stealth", "firewall", "bandwidth"];
        var TRAIN_COST = 15; // energy
        var TRAIN_COOLDOWN = 60000; // 60s
        var TRAIN_XP = 8;

        function ensureStatsState(state) {
            if (!state.stats) state.stats = { cracking: 1, stealth: 1, firewall: 1, bandwidth: 1 };
            for (var i = 0; i < STATS.length; i++) {
                if (state.stats[STATS[i]] === undefined) state.stats[STATS[i]] = 1;
            }
            if (state.lastTrainTime === undefined) state.lastTrainTime = 0;
        }

        function trainStat(statName) {
            var state = FaultlineState.load();
            ensureStatsState(state);
            var now = Date.now();
            if (state.lastTrainTime && now - state.lastTrainTime < TRAIN_COOLDOWN) {
                var secs = Math.ceil((TRAIN_COOLDOWN - (now - state.lastTrainTime)) / 1000);
                FaultlineState.addEvent(state, "alert", "Training cooldown: " + secs + "s remaining");
                return;
            }
            if (state.energy.current < TRAIN_COST) {
                FaultlineState.addEvent(state, "alert", "Insufficient CPU for training (" + state.energy.current + "/" + TRAIN_COST + ")");
                return;
            }
            state.energy.current -= TRAIN_COST;
            state.stats[statName]++;
            state.lastTrainTime = now;
            FaultlineState.save(state);
            FaultlineState.addEvent(state, "system", statName.toUpperCase() + " increased to " + state.stats[statName]);
            if (window.FaultlineLevel) window.FaultlineLevel.addXP(state, TRAIN_XP, "training");
            updateStatsDisplay();
        }

        function updateStatsDisplay() {
            var state = FaultlineState.load();
            ensureStatsState(state);
            for (var i = 0; i < STATS.length; i++) {
                var el = document.getElementById("stat-val-" + STATS[i]);
                if (el) el.textContent = state.stats[STATS[i]];
            }
            // Train cooldown
            var cdEl = document.getElementById("train-cooldown");
            var now = Date.now();
            if (cdEl) {
                if (state.lastTrainTime && now - state.lastTrainTime < TRAIN_COOLDOWN) {
                    var secs = Math.ceil((TRAIN_COOLDOWN - (now - state.lastTrainTime)) / 1000);
                    cdEl.textContent = "CD: " + secs + "s";
                } else {
                    cdEl.textContent = "READY";
                }
            }
            // Disable/enable buttons
            var canTrain = state.energy.current >= TRAIN_COST &&
                           (!state.lastTrainTime || now - state.lastTrainTime >= TRAIN_COOLDOWN);
            document.querySelectorAll(".train-btn").forEach(function (btn) {
                btn.disabled = !canTrain;
            });
        }

        document.querySelectorAll(".train-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                trainStat(this.getAttribute("data-train"));
            });
        });

        var state = FaultlineState.load();
        ensureStatsState(state);
        FaultlineState.save(state);
        updateStatsDisplay();
        setInterval(updateStatsDisplay, 1000);

        window.FaultlineStats = {
            get: function (statName) {
                var state = FaultlineState.load();
                ensureStatsState(state);
                return state.stats[statName] || 1;
            },
            getAll: function () {
                var state = FaultlineState.load();
                ensureStatsState(state);
                return state.stats;
            }
        };
    })();

    // =====================================================
    //  Module 11: Travel / Network Hopping
    // =====================================================
    (function () {
        var travelGrid = document.getElementById("travel-grid");
        if (!travelGrid) return;

        var NETWORKS = [
            { id: "clearnet", name: "CLEARNET",  time: 0,   diff: 1.0, reward: 1.0, minLvl: 1,  minRep: 0  },
            { id: "darknet",  name: "DARKNET",   time: 30,  diff: 1.3, reward: 1.4, minLvl: 5,  minRep: 10 },
            { id: "meshnet",  name: "MESHNET",   time: 45,  diff: 1.2, reward: 1.2, minLvl: 8,  minRep: 15 },
            { id: "corpnet",  name: "CORPNET",   time: 60,  diff: 1.6, reward: 1.8, minLvl: 10, minRep: 20 },
            { id: "satnet",   name: "SATNET",    time: 300, diff: 1.8, reward: 2.0, minLvl: 15, minRep: 30 },
            { id: "govnet",   name: "GOVNET",    time: 120, diff: 2.0, reward: 2.5, minLvl: 20, minRep: 40 },
            { id: "deepweb",  name: "DEEPWEB",   time: 180, diff: 2.2, reward: 3.0, minLvl: 30, minRep: 60 }
        ];

        function ensureTravelState(state) {
            if (!state.currentNetwork) state.currentNetwork = "clearnet";
            if (state.travelStarted === undefined) state.travelStarted = 0;
            if (!state.travelDestination) state.travelDestination = null;
        }

        function getEffectiveTravelTime(baseSecs) {
            if (baseSecs === 0) return 0;
            var bw = window.FaultlineStats ? window.FaultlineStats.get("bandwidth") : 1;
            var reduction = Math.min(50, (bw - 1) * 2);
            if (window.FaultlineMerits) reduction += window.FaultlineMerits.getEffect("travel_reduction");
            reduction = Math.min(50, reduction);
            return Math.max(5, Math.round(baseSecs * (1 - reduction / 100)));
        }

        function isTraveling(state) {
            ensureTravelState(state);
            if (!state.travelStarted || !state.travelDestination) return false;
            var dest = null;
            for (var i = 0; i < NETWORKS.length; i++) {
                if (NETWORKS[i].id === state.travelDestination) { dest = NETWORKS[i]; break; }
            }
            if (!dest) return false;
            var travelTime = getEffectiveTravelTime(dest.time) * 1000;
            return Date.now() - state.travelStarted < travelTime;
        }

        function renderTravel() {
            var state = FaultlineState.load();
            ensureTravelState(state);
            var now = Date.now();

            var netEl = document.getElementById("current-network");
            if (netEl) {
                var curNet = state.currentNetwork || "clearnet";
                netEl.textContent = curNet.toUpperCase();
            }

            // Check if travel completed
            if (state.travelDestination && state.travelStarted) {
                var destNet = null;
                for (var d = 0; d < NETWORKS.length; d++) {
                    if (NETWORKS[d].id === state.travelDestination) { destNet = NETWORKS[d]; break; }
                }
                if (destNet) {
                    var travelTime = getEffectiveTravelTime(destNet.time) * 1000;
                    if (now - state.travelStarted >= travelTime) {
                        state.currentNetwork = state.travelDestination;
                        state.travelDestination = null;
                        state.travelStarted = 0;
                        FaultlineState.save(state);
                        FaultlineState.addEvent(state, "system", "Arrived at " + destNet.name);
                        if (netEl) netEl.textContent = destNet.name;
                    }
                }
            }

            // Travel status
            var statusEl = document.getElementById("travel-status");
            if (statusEl) {
                if (isTraveling(state)) {
                    var destNet2 = null;
                    for (var t = 0; t < NETWORKS.length; t++) {
                        if (NETWORKS[t].id === state.travelDestination) { destNet2 = NETWORKS[t]; break; }
                    }
                    var travelMs = getEffectiveTravelTime(destNet2.time) * 1000;
                    var remaining = Math.max(0, travelMs - (now - state.travelStarted));
                    var secs = Math.ceil(remaining / 1000);
                    var m = Math.floor(secs / 60);
                    var s = secs % 60;
                    _clearEl(statusEl);
                    statusEl.appendChild(_el("div", "travel-status-timer", "Traveling to " + destNet2.name + "... " + m + ":" + (s < 10 ? "0" : "") + s));
                } else {
                    _clearEl(statusEl);
                }
            }

            // Network list
            _clearEl(travelGrid);
            for (var i = 0; i < NETWORKS.length; i++) {
                var n = NETWORKS[i];
                var isCurrent = state.currentNetwork === n.id;
                var traveling = isTraveling(state);
                var lvl = state.level || 1;
                var rep = state.rep ? state.rep.current : 0;
                var locked = lvl < n.minLvl || rep < n.minRep;
                var canTravel = !isCurrent && !traveling && !locked;
                var effTime = getEffectiveTravelTime(n.time);
                var timeStr = effTime === 0 ? "HOME" : (effTime >= 60 ? Math.floor(effTime / 60) + "m " + (effTime % 60) + "s" : effTime + "s");

                var card = _el("div", "travel-card");
                if (isCurrent) card.setAttribute("data-current", "true");
                if (locked) card.setAttribute("data-locked", "true");

                var info = _el("div", "travel-card-info");
                info.appendChild(_el("span", "travel-card-name", n.name + (isCurrent ? " [HERE]" : "")));
                var meta = _el("div", "travel-card-meta");
                meta.appendChild(_el("span", "cyber-badge cyber-badge--sm", timeStr));
                meta.appendChild(_el("span", "cyber-badge cyber-badge--sm cyber-badge--yellow", n.diff + "x diff"));
                meta.appendChild(_el("span", "cyber-badge cyber-badge--sm cyber-badge--green", n.reward + "x reward"));
                if (locked) meta.appendChild(_el("span", "cyber-badge cyber-badge--sm", "LVL " + n.minLvl + " / REP " + n.minRep));
                info.appendChild(meta);
                card.appendChild(info);

                if (canTravel) {
                    var btn = _el("button", "cyber-btn cyber-btn--sm travel-btn", "TRAVEL");
                    btn.setAttribute("data-network", n.id);
                    card.appendChild(btn);
                }
                travelGrid.appendChild(card);
            }

            travelGrid.querySelectorAll(".travel-btn").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    var netId = this.getAttribute("data-network");
                    var s = FaultlineState.load();
                    ensureTravelState(s);
                    s.travelDestination = netId;
                    s.travelStarted = Date.now();
                    FaultlineState.save(s);
                    var destName = netId.toUpperCase();
                    for (var x = 0; x < NETWORKS.length; x++) {
                        if (NETWORKS[x].id === netId) { destName = NETWORKS[x].name; break; }
                    }
                    FaultlineState.addEvent(s, "system", "Traveling to " + destName + "...");
                    renderTravel();
                });
            });
        }

        renderTravel();
        setInterval(renderTravel, 1000);

        window.FaultlineTravel = {
            isTraveling: function () {
                var state = FaultlineState.load();
                return isTraveling(state);
            },
            getMultipliers: function () {
                var state = FaultlineState.load();
                ensureTravelState(state);
                for (var i = 0; i < NETWORKS.length; i++) {
                    if (NETWORKS[i].id === state.currentNetwork) return { diff: NETWORKS[i].diff, reward: NETWORKS[i].reward };
                }
                return { diff: 1.0, reward: 1.0 };
            }
        };
    })();

    // =====================================================
    //  Module 12: Missions & Quests
    // =====================================================
    (function () {
        var fixerList = document.getElementById("fixer-list");
        if (!fixerList) return;

        var FIXERS = [
            { id: "cipher",  name: "CIPHER",  desc: "Data retrieval, simple hacks", minLvl: 1,  color: "green" },
            { id: "ghost",   name: "GHOST",   desc: "Corporate espionage",          minLvl: 10, color: "cyan" },
            { id: "specter", name: "SPECTER", desc: "Government infiltration",      minLvl: 30, color: "magenta" }
        ];

        var MISSION_TEMPLATES = [
            { fixer: "cipher",  title: "Data Extraction",     desc: "Retrieve files from {node}",           xp: 20,  credits: 200,  rep: 2,  reqHacks: 1 },
            { fixer: "cipher",  title: "Port Reconnaissance", desc: "Map open ports on {node}",             xp: 15,  credits: 150,  rep: 1,  reqHacks: 1 },
            { fixer: "cipher",  title: "Credential Harvest",  desc: "Phish credentials from {node} admin",  xp: 25,  credits: 300,  rep: 2,  reqHacks: 1 },
            { fixer: "ghost",   title: "Corporate Breach",    desc: "Infiltrate {node} corporate servers",  xp: 50,  credits: 800,  rep: 4,  reqHacks: 2 },
            { fixer: "ghost",   title: "IP Theft",            desc: "Steal trade secrets from {node}",      xp: 60,  credits: 1000, rep: 5,  reqHacks: 2 },
            { fixer: "ghost",   title: "Insider Access",      desc: "Plant backdoor in {node}",             xp: 45,  credits: 700,  rep: 3,  reqHacks: 2 },
            { fixer: "specter", title: "Govt Infiltration",   desc: "Breach {node} classified database",    xp: 100, credits: 2000, rep: 8,  reqHacks: 3 },
            { fixer: "specter", title: "Blacksite Raid",      desc: "Extract intel from {node} blacksite",  xp: 80,  credits: 1500, rep: 6,  reqHacks: 3 },
            { fixer: "specter", title: "Deep Cover Op",       desc: "Sustained infiltration of {node}",     xp: 90,  credits: 1800, rep: 7,  reqHacks: 3 }
        ];

        var NODE_NAMES = ["CORE-X1", "NEXUS-9", "RELAY-88", "VAULT-13", "GRID-04", "ARC-55", "SHARD-02", "PROXY-6C"];

        function ensureMissionState(state) {
            if (state.activeMission === undefined) state.activeMission = null;
            if (state.missionCooldown === undefined) state.missionCooldown = 0;
            if (state.completedMissions === undefined) state.completedMissions = 0;
        }

        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        function generateMission(fixerId) {
            var templates = MISSION_TEMPLATES.filter(function (t) { return t.fixer === fixerId; });
            var tmpl = pick(templates);
            var node = pick(NODE_NAMES);
            return {
                fixer: fixerId,
                title: tmpl.title,
                desc: tmpl.desc.replace(/\{node\}/g, node),
                xp: tmpl.xp + randInt(-5, 10),
                credits: tmpl.credits + randInt(-50, 100),
                rep: tmpl.rep,
                reqHacks: tmpl.reqHacks,
                hacksCompleted: 0,
                startedAt: Date.now()
            };
        }

        function renderMissions() {
            var state = FaultlineState.load();
            ensureMissionState(state);
            var lvl = state.level || 1;
            var now = Date.now();

            // Active mission panel
            var activePanel = document.getElementById("active-mission-panel");
            if (activePanel) {
                _clearEl(activePanel);
                if (state.activeMission) {
                    var m = state.activeMission;
                    var progress = m.hacksCompleted + "/" + m.reqHacks + " hacks";
                    var card = _el("div", "mission-card");
                    card.appendChild(_el("span", "mission-title", m.title));
                    card.appendChild(_el("span", "mission-desc", m.desc));
                    var rewards = _el("div", "mission-rewards");
                    rewards.appendChild(_el("span", "cyber-badge cyber-badge--sm cyber-badge--green", m.credits + " CR"));
                    rewards.appendChild(_el("span", "cyber-badge cyber-badge--sm", m.xp + " XP"));
                    rewards.appendChild(_el("span", "cyber-badge cyber-badge--sm cyber-badge--yellow", progress));
                    card.appendChild(rewards);
                    var abandonBtn = _el("button", "cyber-btn cyber-btn--sm cyber-mt-xs abandon-mission-btn", "ABANDON");
                    abandonBtn.addEventListener("click", function () {
                        var s = FaultlineState.load();
                        s.activeMission = null;
                        s.missionCooldown = Date.now() + 60000;
                        FaultlineState.save(s);
                        FaultlineState.addEvent(s, "alert", "Mission abandoned");
                        renderMissions();
                    });
                    card.appendChild(abandonBtn);
                    activePanel.appendChild(card);
                }
            }

            // Cooldown display
            var cdEl = document.getElementById("mission-cooldown-display");
            if (cdEl) {
                if (state.missionCooldown && state.missionCooldown > now) {
                    var secs = Math.ceil((state.missionCooldown - now) / 1000);
                    cdEl.textContent = "CD: " + secs + "s";
                } else {
                    cdEl.textContent = state.completedMissions + " completed";
                }
            }

            // Fixer list
            _clearEl(fixerList);
            for (var i = 0; i < FIXERS.length; i++) {
                var f = FIXERS[i];
                var locked = lvl < f.minLvl;
                var canAccept = !locked && !state.activeMission && (!state.missionCooldown || state.missionCooldown <= now);
                var fCard = _el("div", "fixer-card");
                if (locked) fCard.setAttribute("data-locked", "true");
                fCard.appendChild(_el("span", "fixer-name cyber-text-" + f.color, f.name));
                fCard.appendChild(_el("span", "fixer-desc", f.desc + (locked ? " [LVL " + f.minLvl + " required]" : "")));
                if (canAccept) {
                    var acceptBtn = _el("button", "cyber-btn cyber-btn--sm accept-mission-btn", "ACCEPT JOB");
                    acceptBtn.setAttribute("data-fixer", f.id);
                    fCard.appendChild(acceptBtn);
                }
                fixerList.appendChild(fCard);
            }

            fixerList.querySelectorAll(".accept-mission-btn").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    var fixerId = this.getAttribute("data-fixer");
                    var s = FaultlineState.load();
                    ensureMissionState(s);
                    s.activeMission = generateMission(fixerId);
                    FaultlineState.save(s);
                    FaultlineState.addEvent(s, "system", "Accepted mission: " + s.activeMission.title);
                    renderMissions();
                });
            });
        }

        // Track hack completions for active missions
        var origAddEvent = FaultlineState.addEvent;
        FaultlineState.addEvent = function (state, tag, text) {
            var ev = origAddEvent(state, tag, text);
            if (tag === "heist" && text.indexOf("succeeded") !== -1 && state.activeMission) {
                state.activeMission.hacksCompleted++;
                if (state.activeMission.hacksCompleted >= state.activeMission.reqHacks) {
                    // Mission complete!
                    state.credits += state.activeMission.credits;
                    state.rep.current = Math.min(state.rep.current + state.activeMission.rep, state.rep.max);
                    var xpReward = state.activeMission.xp;
                    FaultlineState.save(state);
                    origAddEvent(state, "system", "MISSION COMPLETE: " + state.activeMission.title + " +" + state.activeMission.credits + "cr");
                    if (window.FaultlineLevel) window.FaultlineLevel.addXP(state, xpReward, "mission");
                    state.completedMissions = (state.completedMissions || 0) + 1;
                    state.activeMission = null;
                    state.missionCooldown = Date.now() + 300000; // 5 min
                    FaultlineState.save(state);
                    renderMissions();
                } else {
                    FaultlineState.save(state);
                }
            }
            return ev;
        };

        renderMissions();
        setInterval(renderMissions, 2000);
    })();

    // =====================================================
    //  Module 13: Merit / Skill Tree
    // =====================================================
    (function () {
        var meritsGrid = document.getElementById("merits-grid");
        if (!meritsGrid) return;

        var BRANCHES = [
            { id: "breach", name: "BREACH", color: "green", nodes: [
                { id: "breach_1", name: "Sharp Edge",     cost: 1, effect: "hack_success",      value: 2,  desc: "+2% hack success" },
                { id: "breach_2", name: "Deep Cut",       cost: 2, effect: "hack_success",      value: 3,  desc: "+3% hack success" },
                { id: "breach_3", name: "Data Siphon",    cost: 2, effect: "hack_reward",       value: 10, desc: "+10% hack rewards" },
                { id: "breach_4", name: "Crit Protocol",  cost: 3, effect: "hack_success",      value: 4,  desc: "+4% hack success" },
                { id: "breach_5", name: "Master Key",     cost: 5, effect: "hack_reward",       value: 15, desc: "+15% hack rewards" }
            ]},
            { id: "fortress", name: "FORTRESS", color: "yellow", nodes: [
                { id: "fort_1", name: "Hardened",       cost: 1, effect: "defense",           value: 5,  desc: "+5 defense" },
                { id: "fort_2", name: "Thick Skin",     cost: 2, effect: "max_health",        value: 20, desc: "+20 max HP" },
                { id: "fort_3", name: "Regen Boost",    cost: 2, effect: "health_regen",      value: 10, desc: "+10% HP regen" },
                { id: "fort_4", name: "Iron Wall",      cost: 3, effect: "defense",           value: 8,  desc: "+8 defense" },
                { id: "fort_5", name: "Unbreakable",    cost: 5, effect: "max_health",        value: 50, desc: "+50 max HP" }
            ]},
            { id: "ghost", name: "GHOST", color: "cyan", nodes: [
                { id: "ghost_1", name: "Silent Step",   cost: 1, effect: "cooldown_reduction", value: 3,  desc: "-3% cooldowns" },
                { id: "ghost_2", name: "Evasion",       cost: 2, effect: "stealth_bonus",      value: 5,  desc: "+5% evasion" },
                { id: "ghost_3", name: "Shadow Walk",   cost: 2, effect: "cooldown_reduction", value: 5,  desc: "-5% cooldowns" },
                { id: "ghost_4", name: "Phantom",       cost: 3, effect: "stealth_bonus",      value: 8,  desc: "+8% stealth" },
                { id: "ghost_5", name: "Invisible",     cost: 5, effect: "cooldown_reduction", value: 8,  desc: "-8% cooldowns" }
            ]},
            { id: "architect", name: "ARCHITECT", color: "magenta", nodes: [
                { id: "arch_1", name: "Overclock",      cost: 1, effect: "max_nerve",         value: 10, desc: "+10 max nerve" },
                { id: "arch_2", name: "Extra Cells",    cost: 2, effect: "max_energy",        value: 20, desc: "+20 max CPU" },
                { id: "arch_3", name: "Fast Cycle",     cost: 2, effect: "nerve_regen",       value: 10, desc: "+10% nerve regen" },
                { id: "arch_4", name: "CPU Boost",      cost: 3, effect: "max_energy",        value: 30, desc: "+30 max CPU" },
                { id: "arch_5", name: "Supercharged",   cost: 5, effect: "max_nerve",         value: 25, desc: "+25 max nerve" }
            ]},
            { id: "broker", name: "BROKER", color: "yellow", nodes: [
                { id: "brok_1", name: "Haggle",        cost: 1, effect: "buy_discount",      value: 5,  desc: "-5% buy prices" },
                { id: "brok_2", name: "Fence",          cost: 2, effect: "sell_bonus",        value: 10, desc: "+10% sell prices" },
                { id: "brok_3", name: "Bulk Deal",      cost: 2, effect: "buy_discount",      value: 8,  desc: "-8% buy prices" },
                { id: "brok_4", name: "Insider",        cost: 3, effect: "sell_bonus",        value: 15, desc: "+15% sell prices" },
                { id: "brok_5", name: "Black Mogul",    cost: 5, effect: "buy_discount",      value: 12, desc: "-12% buy prices" }
            ]},
            { id: "navigator", name: "NAVIGATOR", color: "cyan", nodes: [
                { id: "nav_1", name: "Quick Route",    cost: 1, effect: "travel_reduction",  value: 5,  desc: "-5% travel time" },
                { id: "nav_2", name: "Mesh Access",    cost: 2, effect: "territory_defense",  value: 5,  desc: "+5% territory def" },
                { id: "nav_3", name: "Fast Lane",      cost: 2, effect: "travel_reduction",  value: 8,  desc: "-8% travel time" },
                { id: "nav_4", name: "Grid Lock",      cost: 3, effect: "territory_defense",  value: 10, desc: "+10% territory def" },
                { id: "nav_5", name: "Quantum Hop",    cost: 5, effect: "travel_reduction",  value: 12, desc: "-12% travel time" }
            ]}
        ];

        function ensureMeritsState(state) {
            if (!state.merits) state.merits = {};
        }

        function canAfford(state, node) {
            if (!state.exploitPoints) return false;
            var currentLvl = state.merits[node.id] || 0;
            return currentLvl === 0 && state.exploitPoints >= node.cost;
        }

        function renderMerits() {
            var state = FaultlineState.load();
            ensureMeritsState(state);
            if (state.exploitPoints === undefined) state.exploitPoints = 0;

            var epEl = document.getElementById("merits-ep-display");
            if (epEl) epEl.textContent = state.exploitPoints + " EP available";

            _clearEl(meritsGrid);
            for (var b = 0; b < BRANCHES.length; b++) {
                var branch = BRANCHES[b];
                var branchEl = _el("div", "merit-branch");
                branchEl.appendChild(_el("span", "merit-branch-name cyber-text-" + branch.color, branch.name));
                for (var n = 0; n < branch.nodes.length; n++) {
                    var node = branch.nodes[n];
                    var purchased = state.merits[node.id] ? true : false;
                    // Must buy in order
                    var prevPurchased = n === 0 || (state.merits[branch.nodes[n - 1].id] ? true : false);
                    var locked = !purchased && !prevPurchased;

                    var nodeEl = _el("div", "merit-node");
                    nodeEl.setAttribute("data-merit", node.id);
                    if (purchased) nodeEl.setAttribute("data-purchased", "true");
                    if (locked) nodeEl.setAttribute("data-locked", "true");
                    nodeEl.appendChild(_el("div", "merit-node-name", node.name));
                    nodeEl.appendChild(_el("div", "merit-node-cost", purchased ? "OWNED" : node.cost + " EP"));
                    nodeEl.appendChild(_el("div", "stat-card-desc cyber-text-muted", node.desc));
                    branchEl.appendChild(nodeEl);
                }
                meritsGrid.appendChild(branchEl);
            }

            meritsGrid.querySelectorAll(".merit-node").forEach(function (el) {
                el.addEventListener("click", function () {
                    if (this.getAttribute("data-locked") === "true") return;
                    if (this.getAttribute("data-purchased") === "true") return;
                    var meritId = this.getAttribute("data-merit");
                    purchaseMerit(meritId);
                });
            });
        }

        function purchaseMerit(meritId) {
            var state = FaultlineState.load();
            ensureMeritsState(state);
            // Find node
            var node = null;
            for (var b = 0; b < BRANCHES.length; b++) {
                for (var n = 0; n < BRANCHES[b].nodes.length; n++) {
                    if (BRANCHES[b].nodes[n].id === meritId) {
                        node = BRANCHES[b].nodes[n];
                        // Check previous is purchased
                        if (n > 0 && !state.merits[BRANCHES[b].nodes[n - 1].id]) return;
                        break;
                    }
                }
                if (node) break;
            }
            if (!node) return;
            if (state.merits[node.id]) return;
            if (!state.exploitPoints || state.exploitPoints < node.cost) return;

            state.exploitPoints -= node.cost;
            state.merits[node.id] = 1;
            FaultlineState.save(state);
            FaultlineState.addEvent(state, "system", "Merit unlocked: " + node.name);
            renderMerits();
        }

        renderMerits();
        setInterval(renderMerits, 3000);

        window.FaultlineMerits = {
            getEffect: function (effectName) {
                var state = FaultlineState.load();
                ensureMeritsState(state);
                var total = 0;
                for (var b = 0; b < BRANCHES.length; b++) {
                    for (var n = 0; n < BRANCHES[b].nodes.length; n++) {
                        var node = BRANCHES[b].nodes[n];
                        if (state.merits[node.id] && node.effect === effectName) {
                            total += node.value;
                        }
                    }
                }
                return total;
            }
        };
    })();
});
