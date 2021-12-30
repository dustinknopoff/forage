---
title: Financial Dashboard
date: 2021-12-31
draft: true
extra:
  link: https://github.com/dustinknopoff/financial-dashboard
taxonomies:
  categories:
    - finance
  tags:
    - shell
---

As I've come to increasingly appreciate `hledger`, I've wanted to use a combination of color and charts to focus on the key insights from my financial data I consider important.

I came across [this](https://memo.barrucadu.co.uk/personal-finance.html) article by @barrucadu and the output, a grafana dashboard, was a sight to see!

Naturally, I had a go at using their scripts but ran into too many things I didn't understand.

Eventually though, I couldn't stop thinking about it and attempted it myself.

## The Dash

> Using a sample journal

```
account Assets       ; type:A, things I own
account Liabilities  ; type:L, things I owe
account Equity       ; type:E, net worth or "total investment"; equal to A - L
account Expenses     ; type:X, outflow categories; part of E, separated for reporting

2021-12-30 Income
    Assets      3000 USD
    Income

2021-12-30 Expenses 1
    Expenses:1   12 USD
    Assets

2021-12-30 Expenses 2
    Expenses:2   30 USD
    Assets

2021-12-30 Expenses 3
    Expenses:3   350 USD
    Assets

2021-12-30 Expenses 4
    Expenses:1   4.50 USD
    Assets
```

![](https://res.cloudinary.com/dcloudinary/image/upload/v1640899587/portfolio/fd.png)

There are 4 queries to hledger powering this dash.

```
hledger bal ^Income -O csv -M -b lastquarter -C -U -T -X USD
```

Broken down:
- we're requesting the balance sheet filtered to only include
  -  accounts starting with `Income`
  -  We include a total row (`-T`)
  -  columns for each month (`M`) starting from the beginning of last quarter (`-b lastquarter`)
  -  Only cleared or unmarked transactions (`-C -U`)
  -  all accounts converted to be in dollars (`-X USD`)
  -  In csv format (`-O csv`)

Outputs:

```
"account","2021-07","2021-08","2021-09","2021-10","2021-11","2021-12","total"
"Income","0","0","0","0","0","-3000.00 USD","-3000.00 USD"
"total","0","0","0","0","0","-3000.00 USD","-3000.00 USD"
```

```
hledger bal ^Expenses -O csv -M -b lastquarter -C -U -T -X USD
```

Exactly the same but for accounts starting with `Expenses`

Outputs:

```
"account","2021-07","2021-08","2021-09","2021-10","2021-11","2021-12","total"
"Expenses:1","0","0","0","0","0","16.50 USD","16.50 USD"
"Expenses:2","0","0","0","0","0","30.00 USD","30.00 USD"
"Expenses:3","0","0","0","0","0","350.00 USD","350.00 USD"
"total","0","0","0","0","0","396.50 USD","396.50 USD"
```

```
hledger bal ^Expenses  --begin thismonth -O csv -X USD
```

A simplification of the previous query and only for the current month.

Outputs:

```
"account","balance"
"Expenses:1","16.50 USD"
"Expenses:2","30.00 USD"
"Expenses:3","350.00 USD"
"total","396.50 USD"
```

```
hledger bal Liabilities --format '%(total)' -X USD
```

Total amount of liabilities

Outputs:

```
--------------------
0
```

There are 3 key aspects of my financial health I am tracking here.

## 1) Savings Rate over the last <=8 months

The first graph, a step graph, shows the savings rate for each month.

Each month's savings rate is calculated as:

```
(income - expenses) / income
```

I'm using the [textplots-rs](https://github.com/loony-bean/textplots-rs) library to create this graph.

## 2) Average Savings Rate

This is simply each month's rate in graph averaged over the number of months

## 3) Expenses breakdown

For every expense account, divide the balance this month from the total. Plotted using the [piechart](https://github.com/jakobhellermann/piechart) library.

## Implementation Details

```rs
    // Initializations
    let mut cummulative_rate = 0_f32;
    let max_capacity = all_expenses.len();
    let mut rates: Vec<(f32, f32)> = Vec::with_capacity(max_capacity - 1);
    let mut avg_daily_expense = 0_f32;
    let mut avg_daily_income = 0_f32;
    // Skips account name column and total column
    // all_expenses.len() - 1 would be the last in the list
    let num_months = all_expenses.len() - 2;
    // We've prefiltered to remove all but the last row
    // "account","2021-07","2021-08","2021-09","2021-10","2021-11","2021-12","total"
    // "Expenses:1","0","0","0","0","0","16.50 USD","16.50 USD"
    // "Expenses:2","0","0","0","0","0","30.00 USD","30.00 USD"
    // "Expenses:3","0","0","0","0","0","350.00 USD","350.00 USD"
    // "total","0","0","0","0","0","396.50 USD","396.50 USD"
    //index: 0                                  index: len -1
    // This is filtered to be on the `total` row. For each month
    for (index, value) in all_expenses.iter().enumerate() {
        // skipping first column (account name) and last (total)
        if index != 0 && index <= num_months {
            // My USD are reported as 1,000.00 USD, 
            // `string_to_f32` strips the comma and parses as a float
            let expenses: f32 = string_to_f32(value)?;
            // Grab the same index from the `Income` query and parse to float
            let income: f32 = string_to_f32(all_income.iter().nth(index).unwrap())?;
            // Calculate rate
            let rate = (income - expenses) / income;
            // If it's NaN, return 0
            let rate = if rate.is_nan() { 0_f32 } else { rate };
            // Push to our List for displaying as a step graph
            rates.push(((index - 1) as f32, rate * 100_f32));
            // Sum average daily expenses and income hard coded to a month as 30 days
            avg_daily_expense += expenses / 30_f32;
            avg_daily_income += income / 30_f32;
            // Add to cummulative_rate
            cummulative_rate += rate;
        }
    }
    // Calculate average daily income over months in this + last quarter
    avg_daily_income /= (num_months) as f32;
    avg_daily_expense /= (num_months) as f32;
    // calculate average savgins rate over months in this + last quarter
    cummulative_rate /= (num_months) as f32;
```

And the expenses breakdown

```rs
    let expenses_breakdown = fetch_expenses_this_month()?;
    // Get final row/column as number
    // "account","balance"
    // "Expenses:1","16.50 USD"
    // "Expenses:2","30.00 USD"
    // "Expenses:3","350.00 USD"
    // "total","396.50 USD"
    //         ^ uses this number
    let total: f32 = string_to_f32(expenses_breakdown.last().unwrap().iter().last().unwrap())?;
    // Skipping the account name column, 
    // create the data structure for our piechart
    let data: Vec<piechart::Data> = expenses_breakdown[..expenses_breakdown.len() - 1]
        .iter()
        .enumerate()
        .map(|(index, expense)| piechart::Data {
            label: expense.get(0).unwrap().into(),
            // Value / total is percentage of total
            value: string_to_f32(expense.get(1).unwrap()).unwrap() / total,
            fill: fills[index % 5],
            color: Some(colors[index % 5].into()),
        })
        .collect();
```

```rs
// Fills and Colors
    let fills = ['•', '▪', '▴', '░', '▀'];
    let colors = [
        Color::Blue,
        Color::Red,
        Color::Green,
        Color::Yellow,
        Color::Purple,
    ];
```