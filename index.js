(function (payer) {
    const promises = [];
    const months = {
        jan: 0,
        feb: 1,
        mrt: 2,
        apr: 3,
        mei: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        okt: 9,
        nov: 10,
        dec: 11,
    }

    for (let button of document.querySelectorAll(".statement-table > div div[role=button]")) {
        promises.push(Promise.resolve(button).then((button) => {
            return new Promise(resolve => {
                const parent = button.parentElement.parentElement;

                if (button.classList.contains("statement-header--is-expanded")) {
                    resolve(parent.querySelector("ics-transaction-list"));
                    return;
                }

                button.click();

                const interval = setInterval(() => {
                    const list = parent.querySelector("ics-transaction-list");
                    if (!list) {
                        return;
                    }

                    clearInterval(interval);
                    resolve(list);
                }, 500);
            }).then((list) => {
                const dateHeader = list.parentElement.querySelector(".statement-header__period").textContent.trim();
                const matches = dateHeader.match(/^[0-9]+ ([a-z]+)\.?\s+t\/m\s+[0-9]+ ([a-z]+)\.? ([0-9]+)$/);

                const years = {}
                let year = parseInt(matches[3]);
                let endMonth = months[matches[2]];
                let startMonth = months[matches[1]];

                if (startMonth > endMonth) { // Means we crossed a year boundary
                    for (let i = startMonth; i <= endMonth + 12; i++) {
                        years[i % 12] = year - (Math.ceil((startMonth - endMonth) / 12) - Math.floor(i / 12));
                    }
                } else {
                    for (let i = startMonth; i <= endMonth; i++) {
                        years[i] = year;
                    }
                }

                let rows = [];

                list.querySelectorAll("ics-transaction").forEach((t) => {
                    // make sure to open the transaction details
                    t.querySelector(".b-transaction-header.b-transaction-header--has-details:not(.expanded)")?.click();

                    let memo = (t.querySelector(".b-transaction-details__merchantCategoryCodeDescription")?.textContent ?? "").trim();
                    let payee = t.querySelector(".b-transaction-header__description-wrapper .b-transaction-header__description").textContent.trim();
                    let rawDate = t.querySelector(".i-no-line-height").textContent.trim().split("\n")[0].trim().split(" ");
                    let day = parseInt(rawDate[0]);
                    let rawMonth = months[rawDate[1].substring(0, 3)];
                    let month = rawMonth + 1;

                    let amountBlock = t.querySelectorAll(".b-transaction-payment__amount div span.i-float-right");
                    let amount = amountBlock[0].textContent.trim().substring(2).replace('.', '');
                    if (amountBlock[1].textContent.trim().toLowerCase() === "af") {
                        amount = "-" + amount;
                    }

                    if (day < 10) day = '0' + day;
                    if (month < 10) month = '0' + month;

                    const formattedDate = day + '/' + month + '/' + (years[rawMonth] ?? year);

                    rows.push([
                        formattedDate,
                        amount,
                        payer,
                        '',
                        payee.replace(';', ''),
                        memo.replace(';', '')
                    ]);
                });

                return rows;
            });
        }));
    }

    Promise.all(promises).then(r => r.flat()).then((rows) => {
        let csv = "Datum;Bedrag;Eigen Rekening;Tegen Rekening;Omschrijving 1;Omschrijving 2\n";

        for (let row of rows) {
            csv += row.join(';') + '\n';
        }

        const blob = new Blob([csv], {type: "text/csv"});
        const url  = window.URL.createObjectURL(blob);
        window.location.assign(url);
    });
})('!!REPLACE ME!!');
