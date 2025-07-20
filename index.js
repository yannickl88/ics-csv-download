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

    for (let section of document.querySelectorAll("lib-period-accordion")) {
        promises.push(Promise.resolve(section).then((section) => {
            return new Promise(resolve => {
                const container = section.querySelector('div.period-transactions')

                if (container && container.classList.contains("expanded")) {
                    resolve(container);
                    return;
                }

                section.querySelector('header').click();

                const interval = setInterval(() => {
                    const firstFound = section.querySelector('div.period-transactions > lib-transaction-list-item');

                    if (!firstFound) {
                        return;
                    }

                    clearInterval(interval);

                    resolve(section.querySelector('div.period-transactions'));
                }, 500);
            }).then((/*HTMLDivElement*/ container) => {
                /** @var {NodeListOf<HTMLElement>} elements */
                const elements = container.querySelectorAll('lib-transaction-list-item-date-divider,lib-transaction-list-item');
                /** @var {array|undefined} currentDate */
                let currentDate = undefined;

                let rows = [];

                for (const element of elements) {
                    if (element.tagName === 'LIB-TRANSACTION-LIST-ITEM-DATE-DIVIDER') {
                        const matches = element.textContent.trim().match(/^([0-9]+) ([a-z]+)\.? ([0-9]+)$/);
                        let day = parseInt([matches[1]]);
                        let month = months[matches[2]] + 1;
                        let year = parseInt(matches[3]);

                        currentDate = [day, month, year];
                    }
                    if (element.tagName === 'LIB-TRANSACTION-LIST-ITEM') {
                        let amount = (element.querySelector(".transaction-amount")?.textContent ?? "").trim();
                        amount = amount
                          .replace('.', '')
                          .replace(',', '.')
                          .replace(/€ /, '')
                          .replace(/^\+ */, '')
                          .replace(' ', '');

                        const transactionInfo = element.querySelector('.transaction-info');

                        const payee = (transactionInfo.querySelector(".transaction-headline1")?.textContent ?? "").trim();
                        const memo = (transactionInfo.querySelector(".transaction-headline2")?.textContent ?? "").trim();

                        let day = currentDate[0];
                        let month = currentDate[1];
                        let year = currentDate[2];

                        if (day < 10) day = '0' + day;
                        if (month < 10) month = '0' + month;

                        const formattedDate = day + '/' + month + '/' + year;

                        rows.push([
                            formattedDate,
                            amount,
                            payer,
                            '',
                            payee,
                            memo
                        ]);
                    }
                }

                return rows;
            });
        }));
    }

    Promise.all(promises).then(r => r.flat()).then((rows) => {
        let csv = "Datum;Bedrag;Eigen Rekening;Tegen Rekening;Omschrijving 1;Omschrijving 2\n";

        for (let row of rows) {
            if (row[1] === '0.00') {
                continue;
            }

            csv += row.join(';') + '\n';
        }

        const blob = new Blob([csv], {type: "text/csv"});
        const url  = window.URL.createObjectURL(blob);
        window.location.assign(url);
    });
})('!!REPLACE ME!!');
