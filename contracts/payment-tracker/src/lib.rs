#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec, vec, log};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payment {
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub memo: String,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    PaymentCounter,
    Payment(u32),
}

#[contract]
pub struct PaymentTracker;

const MAX_PAYMENTS: u32 = 1000;

#[contractimpl]
impl PaymentTracker {
    pub fn record_payment(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
        memo: String,
    ) -> u32 {
        sender.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        if amount > 1_000_000_000_000_000_000 {
            panic!("amount exceeds maximum");
        }

        let mut counter: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::PaymentCounter)
            .unwrap_or(0);

        if counter >= MAX_PAYMENTS {
            panic!("payment storage limit reached");
        }

        counter += 1;

        let payment = Payment {
            sender: sender.clone(),
            recipient: recipient.clone(),
            amount,
            memo: memo.clone(),
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Payment(counter), &payment);
        env.storage().persistent().set(&DataKey::PaymentCounter, &counter);

        log!(&env, "Payment recorded: id={}, sender={}, recipient={}, amount={}", counter, sender, recipient, amount);

        env.events().publish(
            symbol_short!("payment"),
            (counter, sender, recipient, amount, memo),
        );

        counter
    }

    pub fn get_payment(env: Env, id: u32) -> Payment {
        if id == 0 {
            panic!("invalid payment id");
        }

        env.storage().persistent().get(&DataKey::Payment(id))
            .unwrap_or_else(|| panic!("payment not found"))
    }

    pub fn get_payments(env: Env, addr: Address, limit: u32) -> Vec<Payment> {
        let counter: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::PaymentCounter)
            .unwrap_or(0);

        let limit = if limit == 0 || limit > counter { counter } else { limit };
        let start = if counter > limit { counter - limit + 1 } else { 1 };
        let mut payments = vec![&env];

        for id in start..=counter {
            if let Some(payment) = env.storage().persistent().get(&DataKey::Payment(id)) {
                if payment.sender == addr || payment.recipient == addr {
                    payments.push_back(payment);
                }
            }
        }

        payments
    }

    pub fn payment_count(env: Env) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::PaymentCounter)
            .unwrap_or(0)
    }
}

mod test;
