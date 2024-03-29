---
title: Plaintext Accounting Crib Sheet
date: 2021-12-25
taxonomies:
  categories:
    - blog
  tags:
    - finance
    - plaintext
---

I recently watched, [this video by Colin Dean](https://www.youtube.com/watch?v=FJtaM43PgXQ) which for the first time made plaintext accounting click.

This is a brief overview of what `hledger` is used for and the key takeaways to stick with it.

## Overview

`hledger` is part of a family of programs focused on [plaintext accounting](https://plaintextaccounting.org). I've found myself hopping around _many_ financial tracking applications and largely unhappy with all of them (_especially_ when it comes to multi-currency accounts).

At the heart of `hledger` lies the ledger file. This is a regular textfile usually with the extension `.journal`.

The recommendation is to with something like this

```tsv
; Declare top level accounts, setting their types and display order;
; Replace these account names with yours; it helps commands like bs and is detect them.
account Assets       ; type:A, things I own
account Liabilities  ; type:L, things I owe
account Equity       ; type:E, net worth or "total investment"; equal to A - L
account Expenses     ; type:X, outflow categories; part of E, separated for reporting

commodity 1,000.00 USD
commodity 1,000.00 GBP
```

- Assets include things like checking accounts, savings, investments, cash in your wallet or purse.
- Liabilities is anything you owe (mortgage, credit cards, etc.)
- Expenses is anything you pay for (coffee shop, groceries, software, etc.)
- Equity is...still something I don't understand.

Where in Mint or You Need a Budget like programs you might see a transaction like this

```tsv
Jul 4, 2021 Brindisa, Spanish Foods   ...   $23.49
```

`hledger` **requires** every transaction to be balanced (equaling 0)

```tsv
2021-07-04 Brindisa, Spanish Foods
  Expenses:Food                              23.49 USD
  Liabilities:CreditCards:American Express  -23.49 USD
```

The is the double entry part of double entry bookkeeping.

With that background, here are some key points to make using hledger easier.

## Start right now

Don't try to backfill information for this year. It will be a painfully tedious process and likely make you not want to continue.

When you're declaring balances of prior to tracking with `hledger`, balance your transactions against Equity.

```tsv
2021-12-24 Opening Balances
  Assets:Checking     48.33 USD
  Equity             -48.33 USD
```

## Don't use money signs

Always use USD in place of `$`. The same for all currencies. Certain tools do not work with currency signs.

## Commodities

Everything is a commodity. A US Dollar, British Pound, or a BTC. Their values is only derived based on what you define it as.

```tsv
P 2021/12/25 12:00:00 AAPL @ 170.00 USD
```

It's only after adding a line like this in your ledger that the commodity "AAPL" has a value. It has no relation to the actual stock except for when you define a price at a given date/time.

## Where do things go?

### Starting

The most confusing part tutorials never explain is how to start a ledger when you already have money in your bank account. The answer? It comes from Equity.

More succinctly:


> Opening Balances (+) Asset, (-) Equity

```tsv
; Example
2021-12-25 Opening Balance
    Assets:Checking     2000.00 USD
    Equity              -2000.00 USD
```

### Paying

What about when you pay for things? Isn't it weird that Expenses would be positive? Since they're coming out of your bank account? This was the most confusing for me until I learned how this is used in querying your ledger.

But first, here's how you should record expenses

> Paying for things are (+) Expenses, (-) Liability or Asset depending on credit/debit respectively

Once this is in place, you can query for your cash flow (Comparing what comes in vs goes out)

```tsv
$ hledger bal ^Income ^Expenses
           28.60 GBP  Expenses:Food:Groceries
           34.10 GBP  Expenses:Shopping:Electronics & Software
         -200.00 GBP  Income:Paycheck
--------------------
        -137.30 GBP
```

**If your cashflow is positive that means your expenses are higher than income.**

In the case where you pay with a credit card, these purchases would go against your liability.

Your net worth is the same comparison but between Assets and Liabilities

```tsv
$ hledger bal ^Assets ^Liabilities

           43.49 USD  Assets:Checking
          -20.56 USD  Liabilities:CreditCards:Amex
--------------------
           22.93 USD

```

(In this case, the goal is to have more than you owe! It's ok if you don't though. In 2014. ~50% of Americans had a net worth of 0)

## With how much detail should I create accounts?

### Assets

I label by kind (Checking, Savings, Wallet, Investment) and then the name of the company

i.e.

```tsv
Assets:Checking:Bank of America
Assets:Investments:Charles Schwab
Assets:Cash:Wallet
```

### Expenses

In general, keep things as simple as possible! But, if you need a reference [Mint has a list of the categories they provide](https://mint.intuit.com/mint-categories)

<details>
<summary>The list as Ledger Account Names</summary>

```tsv
Income:Paycheck
Income:Investment
Income:Returned Purchase
Income:Bonus
Income:Interest Income
Income:Reimbursement
Income:Rental Income

Assets:Miscellaneous:Cash & ATM
Assets:Miscellaneous:Check

Expense:Entertainment:Arts
Expense:Entertainment:Music
Expense:Entertainment:Movies & DVDs
Expense:Entertainment:Newspaper & Magazines

Expenses:Education:Tuition
Expenses:Education:Student Loan
Expenses:Education:Books & Supplies

Expenses:Shopping:Clothing
Expenses:Shopping:Books
Expenses:Shopping:Electronics & Software
Expenses:Shopping:Hobbies
Expenses:Shopping:Sporting Goods

Expenses:PersonalCare:Laundry
Expenses:PersonalCare:Hair
Expenses:PersonalCare:Spa & Massage

Expenses:Health:Dentist
Expenses:Health:Doctor
Expenses:Health:Eye Care
Expenses:Health:Pharmacy
Expenses:Health:Health Insurance
Expenses:Health:Gym
Expenses:Health:Sports

Expenses:Kids:Activities
Expenses:Kids:Allowance
Expenses:Kids:Baby Supplies
Expenses:Kids:Babysitter & Daycare
Expenses:Kids:Child Support
Expenses:Kids:Toys

Expenses:Food:Groceries
Expenses:Food:Coffee Shops
Expenses:Food:Fast Food
Expenses:Food:Restaurants
Expenses:Food:Alcohol

Expenses:GiftsDonations:Gift
Expenses:GiftsDonations:Charity

Expenses:Investments:Deposit
Expenses:Investments:Withdrawal
Expenses:Investments:Dividends & Cap Gains
Expenses:Investments:Buy
Expenses:Investments:Sell


Expenses:Utilities:Television
Expenses:Utilities:Home Phone
Expenses:Utilities:Internet
Expenses:Utilities:Mobile Phone
Expenses:Utilities:Utilities

Expenses:Transport:Gas & Fuel
Expenses:Transport:Parking
Expenses:Transport:Service & Auto Parts
Expenses:Transport:Auto Payment
Expenses:Transport:Auto Insurance

Expenses:Travel:Air Travel
Expenses:Travel:Hotel
Expenses:Travel:Rental Car & Taxi
Expenses:Travel:Vacation

Expenses:Fees:Service Fee
Expenses:Fees:Late Fee
Expenses:Fees:Finance Charge
Expenses:Fees:ATM Fee
Expenses:Fees:Bank Fee
Expenses:Fees:Commissions

Expenses:Business:Advertising
Expenses:Business:Office Supplies
Expenses:Business:Printing
Expenses:Business:Shipping
Expenses:Business:Legal

Expenses:Taxes:Federal Tax
Expenses:Taxes:State Tax
Expenses:Taxes:Local Tax
Expenses:Taxes:Sales Tax
Expenses:Taxes:Property Tax
```
</details>

### Income

Label by where it's coming from.

```tsv
Income:Venmo
Income:Google
```

## The most important rule

As tempting as it is to use all the communities different tools for automating downloading your transactions and importing them into ledger (and there are _many_), do it **manually**. The power of plain text accounting comes in the ownership over your financial information.

You can't do that if you're not aware of every transaction.

This was the key which I failed to grasp the first few times trying to use plaintext accounting.
