PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`paymentMethodId` text NOT NULL,
	`paymentMethodType` text NOT NULL,
	`isCard` integer NOT NULL,
	FOREIGN KEY (`category`,`type`) REFERENCES `categories`(`name`,`type`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "transaction_type_check" CHECK(type IN ('income', 'expense')),
	CONSTRAINT "is_card_check" CHECK(isCard IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "date", "amount", "note", "category", "type", "paymentMethodId", "paymentMethodType", "isCard") SELECT "id", "date", "amount", "note", "category", "type", "paymentMethodId", "paymentMethodType", "isCard" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_transactions_date` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `idx_transactions_type` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_transactions_card_payment` ON `transactions` (`paymentMethodId`) WHERE isCard = 1;--> statement-breakpoint
CREATE INDEX `idx_transactions_bank_payment` ON `transactions` (`paymentMethodId`) WHERE isCard = 0;