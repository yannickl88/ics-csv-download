(function () {
    const promises = [];

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
                let year = parseInt(list.parentElement.querySelector(".statement-header__period").textContent.trim().split(" ").pop());
                let rows = [];

                list.querySelectorAll("ics-transaction").forEach((t) => {
                    // make sure to open the transaction details
                    // row b-transaction-header b-transaction-header--has-details expanded
                    t.querySelector("div.row.b-transaction-header--has-details:not(.expanded)")?.click();

                    let memo = (t.querySelector(".b-transaction-details__merchantCategoryCodeDescription")?.textContent ?? "").trim();
                    let payee = t.querySelector(".b-transaction-header__description-wrapper .b-transaction-header__description").textContent.trim();
                    let rawDate = t.querySelector(".i-no-line-height").textContent.trim().split("\n")[0].trim().split(" ");
                    let day = parseInt(rawDate[0]);
                    let month = {
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
                    }[rawDate[1].substring(0, 3)];

                    let date = new Date(year, month, day);

                    let amountBlock = t.querySelectorAll(".billingAmountBlock div span.i-float-right");
                    let amount = amountBlock[0].textContent.trim().substring(2).replace('.', '').replace(',', '.');
                    if (amountBlock[1].textContent.trim().toLowerCase() === "af") {
                        amount = "-" + amount;
                    }

                    rows.push([date.toLocaleDateString('en-US'), payee, memo, amount]);
                });

                return rows;
            });
        }));
    }

    Promise.all(promises).then(r => r.flat()).then((rows) => {
        let csv = "Date,Payee,Memo,Amount\n";

        for (let row of rows) {
            csv += '"' + row.join('","') + '"\n';
        }

        const blob = new Blob([csv], {type: "text/csv"});
        const url  = window.URL.createObjectURL(blob);
        window.location.assign(url);
    });
})();
