#![cfg(test)]
use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Env, String};

#[test]
fn test_record_and_get_payment() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentTracker);
    let client = PaymentTrackerClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let memo = String::from_str(&env, "test payment");

    let id = client.record_payment(&sender, &recipient, &1000, &memo);
    assert_eq!(id, 1);

    let payment = client.get_payment(&id);
    assert_eq!(payment.sender, sender);
    assert_eq!(payment.recipient, recipient);
    assert_eq!(payment.amount, 1000);
    assert_eq!(payment.memo, memo);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_zero_amount() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentTracker);
    let client = PaymentTrackerClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let memo = String::from_str(&env, "zero");

    client.record_payment(&sender, &recipient, &0, &memo);
}

#[test]
#[should_panic(expected = "payment not found")]
fn test_get_nonexistent_payment() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentTracker);
    let client = PaymentTrackerClient::new(&env, &contract_id);

    client.get_payment(&999);
}
