CREATE TABLE `bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`accountNumber` text NOT NULL,
	`bankName` text NOT NULL,
	`balance` real NOT NULL,
	`type` text NOT NULL,
	CONSTRAINT "account_type_check" CHECK(type IN ('checking', 'savings', 'credit', 'investment'))
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`type` text NOT NULL,
	`name` text NOT NULL,
	PRIMARY KEY(`type`, `name`),
	CONSTRAINT "type_check" CHECK(type IN ('income', 'expense'))
);
--> statement-breakpoint
CREATE TABLE `credit_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cardNumber` text NOT NULL,
	`creditLimit` real NOT NULL,
	`creditBalance` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`paymentMethodId` text NOT NULL,
	`paymentMethodType` text NOT NULL,
	`isCard` integer NOT NULL,
	FOREIGN KEY (`category`) REFERENCES `categories`(`name`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "transaction_type_check" CHECK(type IN ('income', 'expense')),
	CONSTRAINT "is_card_check" CHECK(isCard IN (0, 1))
);
