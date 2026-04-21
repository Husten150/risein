// Enhanced Stellar dApp with Complete Freighter Wallet Integration
class StellarDApp {
    constructor() {
        // Stellar Configuration - Matches Freighter Wallet Testnet Settings
        this.networkConfig = {
            name: 'Test Net',
            horizonUrl: 'https://horizon-testnet.stellar.org',
            sorobanRpcUrl: 'https://soroban-testnet.stellar.org/',
            passphrase: 'Test SDF Network ; September 2015',
            friendbotUrl: 'https://friendbot.stellar.org'
        };
        
        this.server = new StellarSdk.Server(this.networkConfig.horizonUrl);
        this.networkPassphrase = this.networkConfig.passphrase;
        this.horizonUrl = this.networkConfig.horizonUrl;
        
        // Wallet State
        this.connectedWallet = null;
        this.accountData = null;
        this.transactionHistory = this.loadTransactionHistory();
        
        // UI State
        this.isLoading = false;
        this.networkStats = {
            ledger: 0,
            baseFee: 100,
            reserveAmount: 1,
            transactionCount: 0
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkFreighterAvailability();
        this.loadNetworkStats();
        this.updateTransactionHistoryDisplay();
        
        // Set up periodic network stats update
        setInterval(() => this.loadNetworkStats(), 30000);
    }

    setupEventListeners() {
        // Wallet events
        document.getElementById('connect-wallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('disconnect-wallet').addEventListener('click', () => this.disconnectWallet());
        document.getElementById('copy-address').addEventListener('click', () => this.copyAddress());
        
        // Balance events
        document.getElementById('refresh-balance').addEventListener('click', () => this.updateBalance());
        
        // Funding events
        document.getElementById('fund-wallet').addEventListener('click', () => this.fundWallet());
        
        // Transaction events
        document.getElementById('send-transaction').addEventListener('click', () => this.sendTransaction());
        document.getElementById('validate-address').addEventListener('click', () => this.validateAddress());
        document.getElementById('max-amount').addEventListener('click', () => this.setMaxAmount());
        document.getElementById('amount').addEventListener('input', () => this.updateTotalAmount());
        document.getElementById('recipient-address').addEventListener('input', () => this.validateAddressInput());
        
        // History events
        document.getElementById('clear-history').addEventListener('click', () => this.clearTransactionHistory());
        
        // Listen for wallet changes
        if (typeof window !== 'undefined' && window.freighter) {
            window.freighter.on('accountChanged', () => this.handleAccountChanged());
        }
    }

    async checkFreighterAvailability() {
        console.log('Checking for Freighter wallet...');
        console.log('Network Configuration:', this.networkConfig);
        
        if (typeof window.freighter === 'undefined') {
            this.showStatus('Freighter wallet not detected. Please install from freight.app', 'error');
            this.updateConnectionStatus('disconnected');
            document.getElementById('connect-wallet').disabled = true;
            document.getElementById('connect-wallet').innerHTML = 
                '<i class="fas fa-exclamation-triangle mr-2"></i>Freighter Not Found';
            return false;
        }

        try {
            const isConnected = await window.freighter.isConnected();
            if (isConnected) {
                this.showStatus(`Freighter connected to ${this.networkConfig.name} network!`, 'success');
                this.updateConnectionStatus('connected');
                
                // Check if Freighter is on the correct network
                try {
                    const network = await window.freighter.getNetwork();
                    console.log('Freighter network:', network);
                    if (network !== this.networkConfig.passphrase) {
                        this.showStatus('Please switch Freighter to Testnet network', 'warning');
                        this.updateConnectionStatus('wrong-network');
                    }
                } catch (networkError) {
                    console.log('Could not verify network:', networkError);
                }
            } else {
                this.showStatus('Freighter detected. Please unlock your wallet.', 'warning');
                this.updateConnectionStatus('locked');
            }
            return true;
        } catch (error) {
            console.error('Error checking Freighter:', error);
            this.showStatus('Error checking Freighter wallet', 'error');
            return false;
        }
    }

    async connectWallet() {
        if (this.isLoading) return;
        
        try {
            this.setLoading(true);
            this.showLoadingOverlay('Connecting to wallet...');
            
            if (!await this.checkFreighterAvailability()) {
                throw new Error('Freighter wallet not available');
            }

            // Check if wallet is unlocked
            const isConnected = await window.freighter.isConnected();
            if (!isConnected) {
                throw new Error('Please unlock your Freighter wallet first');
            }

            // Get public key with error handling
            let publicKey;
            try {
                publicKey = await window.freighter.getPublicKey();
            } catch (error) {
                if (error.message.includes('User rejected')) {
                    throw new Error('Connection rejected by user');
                }
                throw new Error('Failed to get public key from wallet');
            }
            
            if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
                throw new Error('Invalid public key received from wallet');
            }

            this.connectedWallet = publicKey;
            await this.updateBalance();
            this.updateUI();
            this.showStatus('Wallet connected successfully!', 'success');
            this.updateConnectionStatus('connected');

        } catch (error) {
            console.error('Wallet connection error:', error);
            this.showStatus(`Connection failed: ${error.message}`, 'error');
            this.updateConnectionStatus('error');
        } finally {
            this.setLoading(false);
            this.hideLoadingOverlay();
        }
    }

    disconnectWallet() {
        this.connectedWallet = null;
        this.accountData = null;
        this.updateUI();
        this.showStatus('Wallet disconnected', 'info');
        this.updateConnectionStatus('disconnected');
    }

    async handleAccountChanged() {
        if (this.connectedWallet) {
            this.showStatus('Wallet account changed. Please reconnect.', 'warning');
            this.disconnectWallet();
        }
    }

    async updateBalance() {
        if (!this.connectedWallet) return;

        try {
            this.accountData = await this.server.loadAccount(this.connectedWallet);
            const nativeBalance = this.accountData.balances.find(b => b.asset_type === 'native');
            
            if (nativeBalance) {
                const balance = parseFloat(nativeBalance.balance);
                const formattedBalance = balance.toFixed(7);
                
                // Calculate reserves
                const minBalance = parseFloat(this.accountData.minimum_balance || '0');
                const available = Math.max(0, balance - minBalance);
                
                // Update UI
                document.getElementById('balance-display').innerHTML = 
                    `<i class="fas fa-coins mr-2"></i>${formattedBalance} XLM`;
                
                document.getElementById('balance-details').classList.remove('hidden');
                document.getElementById('reserved-balance').textContent = `${minBalance.toFixed(7)} XLM`;
                document.getElementById('available-balance').textContent = `${available.toFixed(7)} XLM`;
                
                // Update amount info
                document.getElementById('amount-info').textContent = 
                    `Available: ${available.toFixed(7)} XLM | Minimum: 0.0000001 XLM`;
            } else {
                document.getElementById('balance-display').innerHTML = 
                    '<i class="fas fa-exclamation-triangle mr-2"></i>0 XLM';
            }
        } catch (error) {
            console.error('Balance update error:', error);
            document.getElementById('balance-display').innerHTML = 
                '<i class="fas fa-exclamation-circle mr-2"></i>Error loading balance';
        }
    }

    async fundWallet() {
        if (!this.connectedWallet || this.isLoading) return;

        try {
            this.setLoading(true);
            const fundBtn = document.getElementById('fund-wallet');
            const fundStatus = document.getElementById('fund-status');
            
            fundBtn.disabled = true;
            fundBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Funding...';
            fundStatus.classList.remove('hidden');
            fundStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Requesting testnet XLM...';

            // Use Friendbot with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.networkConfig.friendbotUrl}?addr=${this.connectedWallet}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fund wallet');
            }

            const result = await response.json();
            
            fundStatus.innerHTML = `
                <div class="text-green-400">
                    <i class="fas fa-check-circle mr-2"></i>
                    Successfully funded with 10,000 testnet XLM!
                    <br><span class="text-xs">Ledger: ${result.result_attr_ledger}</span>
                </div>
            `;

            this.showStatus('Wallet funded successfully!', 'success');
            
            // Update balance after funding
            setTimeout(async () => {
                await this.updateBalance();
                fundBtn.disabled = false;
                fundBtn.innerHTML = '<i class="fas fa-faucet mr-2"></i>Fund with Testnet XLM';
            }, 2000);

        } catch (error) {
            console.error('Funding error:', error);
            const fundStatus = document.getElementById('fund-status');
            const errorMessage = error.name === 'AbortError' ? 
                'Funding request timed out' : error.message;
            
            fundStatus.innerHTML = `
                <div class="text-red-400">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Funding failed: ${errorMessage}
                </div>
            `;
            
            const fundBtn = document.getElementById('fund-wallet');
            fundBtn.disabled = false;
            fundBtn.innerHTML = '<i class="fas fa-faucet mr-2"></i>Fund with Testnet XLM';
            
            this.showStatus(`Funding failed: ${errorMessage}`, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async sendTransaction() {
        if (!this.connectedWallet || this.isLoading) return;

        const recipientAddress = document.getElementById('recipient-address').value.trim();
        const amount = document.getElementById('amount').value;

        // Enhanced validation
        if (!recipientAddress) {
            this.showStatus('Please enter a recipient address', 'warning');
            return;
        }

        if (!this.isValidStellarAddress(recipientAddress)) {
            this.showStatus('Invalid recipient address format', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            this.showStatus('Please enter a valid amount', 'warning');
            return;
        }

        if (parseFloat(amount) > this.getAvailableBalance()) {
            this.showStatus('Insufficient balance', 'error');
            return;
        }

        try {
            this.setLoading(true);
            this.showLoadingOverlay('Processing transaction...');
            
            const sendBtn = document.getElementById('send-transaction');
            const transactionStatus = document.getElementById('transaction-status');
            
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
            transactionStatus.classList.remove('hidden');
            transactionStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating transaction...';

            // Load sender account
            const account = await this.server.loadAccount(this.connectedWallet);
            
            // Create transaction with enhanced options
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.networkPassphrase,
                timebounds: {
                    minTime: 0,
                    maxTime: Math.floor(Date.now() / 1000) + 300 // 5 minutes
                }
            })
                .addOperation(StellarSdk.Operation.payment({
                    destination: recipientAddress,
                    asset: StellarSdk.Asset.native(),
                    amount: amount
                }))
                .addMemo(StellarSdk.Memo.text('Stellar dApp Transaction'))
                .build();

            transactionStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Waiting for signature...';

            // Sign transaction with Freighter
            const signedXDR = await window.freighter.signTransaction(transaction.toXDR(), {
                networkPassphrase: this.networkPassphrase,
                accountToSign: this.connectedWallet
            });

            const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXDR, this.networkPassphrase);

            transactionStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting transaction...';

            // Submit transaction with retry logic
            let result;
            try {
                result = await this.server.submitTransaction(signedTransaction);
            } catch (submitError) {
                if (submitError.response && submitError.response.data.extras) {
                    const txResult = submitError.response.data.extras.result_codes;
                    throw new Error(`Transaction failed: ${txResult.transaction} - ${txResult.operations?.[0] || 'Unknown error'}`);
                }
                throw submitError;
            }

            transactionStatus.innerHTML = `
                <div class="text-green-400">
                    <i class="fas fa-check-circle mr-2"></i>
                    Transaction sent successfully!
                    <br><br>
                    <div class="text-sm space-y-1">
                        <div>Hash: <code class="text-blue-300">${result.hash}</code></div>
                        <div>Ledger: <span class="text-yellow-400">${result.ledger}</span></div>
                        <a href="https://stellar.expert/explorer/testnet/tx/${result.hash}" 
                           target="_blank" 
                           class="text-blue-400 hover:text-blue-300 underline inline-block">
                            <i class="fas fa-external-link-alt mr-1"></i>View on Explorer
                        </a>
                    </div>
                </div>
            `;

            this.showStatus('Transaction sent successfully!', 'success');
            
            // Add to transaction history
            this.addToTransactionHistory({
                hash: result.hash,
                amount: amount,
                recipient: recipientAddress,
                timestamp: new Date().toISOString(),
                status: 'success',
                ledger: result.ledger
            });
            
            // Update transaction count
            this.networkStats.transactionCount++;
            document.getElementById('tx-count').textContent = this.networkStats.transactionCount;
            
            // Clear form and update balance
            document.getElementById('amount').value = '';
            this.updateTotalAmount();
            
            // Update balance with delay
            setTimeout(async () => {
                await this.updateBalance();
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i>Send Transaction';
            }, 3000);

        } catch (error) {
            console.error('Transaction error:', error);
            const transactionStatus = document.getElementById('transaction-status');
            const errorMessage = this.getErrorMessage(error);
            
            transactionStatus.innerHTML = `
                <div class="text-red-400">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Transaction failed: ${errorMessage}
                </div>
            `;
            
            const sendBtn = document.getElementById('send-transaction');
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i>Send Transaction';
            
            this.showStatus(`Transaction failed: ${errorMessage}`, 'error');
        } finally {
            this.setLoading(false);
            this.hideLoadingOverlay();
        }
    }

    // Utility Methods
    isValidStellarAddress(address) {
        try {
            StellarSdk.StrKey.decodeEd25519PublicKey(address);
            return true;
        } catch (error) {
            return false;
        }
    }

    validateAddress() {
        const address = document.getElementById('recipient-address').value.trim();
        const validationEl = document.getElementById('address-validation');
        const validateBtn = document.getElementById('validate-address');
        
        if (!address) {
            validationEl.classList.add('hidden');
            validateBtn.className = 'absolute right-2 top-2.5 text-gray-400 hover:text-white transition-colors';
            return;
        }
        
        if (this.isValidStellarAddress(address)) {
            validationEl.textContent = '✓ Valid address';
            validationEl.className = 'text-xs mt-1 text-green-400';
            validateBtn.className = 'absolute right-2 top-2.5 text-green-400 transition-colors';
        } else {
            validationEl.textContent = '✗ Invalid address format';
            validationEl.className = 'text-xs mt-1 text-red-400';
            validateBtn.className = 'absolute right-2 top-2.5 text-red-400 transition-colors';
        }
        validationEl.classList.remove('hidden');
    }

    validateAddressInput() {
        const address = document.getElementById('recipient-address').value.trim();
        const validationEl = document.getElementById('address-validation');
        
        if (address.length > 0) {
            this.validateAddress();
        } else {
            validationEl.classList.add('hidden');
        }
    }

    getAvailableBalance() {
        if (!this.accountData) return 0;
        const nativeBalance = this.accountData.balances.find(b => b.asset_type === 'native');
        if (!nativeBalance) return 0;
        
        const balance = parseFloat(nativeBalance.balance);
        const minBalance = parseFloat(this.accountData.minimum_balance || '0');
        const fee = 0.00001; // Base fee
        
        return Math.max(0, balance - minBalance - fee);
    }

    setMaxAmount() {
        const available = this.getAvailableBalance();
        if (available > 0) {
            document.getElementById('amount').value = available.toFixed(7);
            this.updateTotalAmount();
        }
    }

    updateTotalAmount() {
        const amount = parseFloat(document.getElementById('amount').value) || 0;
        const fee = 0.00001;
        const total = amount + fee;
        document.getElementById('total-amount').textContent = `${total.toFixed(7)} XLM`;
    }

    async copyAddress() {
        if (!this.connectedWallet) return;
        
        try {
            await navigator.clipboard.writeText(this.connectedWallet);
            this.showStatus('Address copied to clipboard!', 'success');
            
            const copyBtn = document.getElementById('copy-address');
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy address:', error);
            this.showStatus('Failed to copy address', 'error');
        }
    }

    async loadNetworkStats() {
        try {
            const response = await fetch(`${this.horizonUrl}/`);
            const data = await response.json();
            
            this.networkStats.ledger = data.history_latest_ledger;
            document.getElementById('network-ledger').textContent = this.networkStats.ledger;
            
            // Base fee is typically 100 stroops (0.00001 XLM)
            document.getElementById('base-fee').textContent = '100';
            
        } catch (error) {
            console.error('Failed to load network stats:', error);
        }
    }

    getErrorMessage(error) {
        if (error.response && error.response.data.extras) {
            const resultCodes = error.response.data.extras.result_codes;
            return resultCodes.operations?.[0] || resultCodes.transaction || error.message;
        }
        return error.message || 'Unknown error occurred';
    }

    // Transaction History Methods
    loadTransactionHistory() {
        const saved = localStorage.getItem('stellar_transaction_history');
        return saved ? JSON.parse(saved) : [];
    }

    saveTransactionHistory() {
        localStorage.setItem('stellar_transaction_history', JSON.stringify(this.transactionHistory));
    }

    addToTransactionHistory(transaction) {
        this.transactionHistory.unshift(transaction);
        this.saveTransactionHistory();
        this.updateTransactionHistoryDisplay();
    }

    clearTransactionHistory() {
        this.transactionHistory = [];
        this.saveTransactionHistory();
        this.updateTransactionHistoryDisplay();
        this.showStatus('Transaction history cleared', 'info');
    }

    updateTransactionHistoryDisplay() {
        const historyContainer = document.getElementById('transaction-history');
        
        if (this.transactionHistory.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>No transactions yet</p>
                    <p class="text-sm">Send your first transaction to see it here!</p>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = this.transactionHistory.map(tx => `
            <div class="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <i class="fas fa-check-circle text-green-400"></i>
                            <span class="text-green-400 font-semibold">Successful</span>
                            <span class="text-gray-400 text-sm">${new Date(tx.timestamp).toLocaleString()}</span>
                            ${tx.ledger ? `<span class="text-xs text-gray-500">Ledger: ${tx.ledger}</span>` : ''}
                        </div>
                        <div class="space-y-1 text-sm">
                            <p class="text-gray-300">
                                Sent <span class="text-yellow-400 font-bold">${tx.amount} XLM</span>
                            </p>
                            <p class="text-gray-400">
                                To: <code class="text-blue-300">${tx.recipient.substring(0, 8)}...${tx.recipient.substring(tx.recipient.length - 8)}</code>
                            </p>
                            <p class="text-gray-400">
                                Hash: <code class="text-blue-300">${tx.hash.substring(0, 8)}...${tx.hash.substring(tx.hash.length - 8)}</code>
                            </p>
                        </div>
                        <div class="flex space-x-3 mt-2">
                            <a href="https://stellar.expert/explorer/testnet/tx/${tx.hash}" 
                               target="_blank" 
                               class="text-blue-400 hover:text-blue-300 text-sm underline">
                                <i class="fas fa-external-link-alt mr-1"></i>Explorer
                            </a>
                            <button onclick="navigator.clipboard.writeText('${tx.hash}')" 
                                    class="text-gray-400 hover:text-white text-sm underline">
                                <i class="fas fa-copy mr-1"></i>Copy Hash
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // UI Methods
    updateUI() {
        const connectBtn = document.getElementById('connect-wallet');
        const walletInfo = document.getElementById('wallet-info');
        const walletAddress = document.getElementById('wallet-address');
        const refreshBtn = document.getElementById('refresh-balance');
        const fundBtn = document.getElementById('fund-wallet');
        const sendBtn = document.getElementById('send-transaction');

        if (this.connectedWallet) {
            connectBtn.classList.add('hidden');
            walletInfo.classList.remove('hidden');
            walletAddress.textContent = this.connectedWallet;
            refreshBtn.disabled = false;
            fundBtn.disabled = false;
            sendBtn.disabled = false;
        } else {
            connectBtn.classList.remove('hidden');
            walletInfo.classList.add('hidden');
            refreshBtn.disabled = true;
            fundBtn.disabled = true;
            sendBtn.disabled = true;
            document.getElementById('balance-display').innerHTML = 
                '<i class="fas fa-spinner fa-spin mr-2"></i><span>Connect wallet</span>';
            document.getElementById('balance-details').classList.add('hidden');
        }
    }

    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connection-status');
        const statusConfig = {
            connected: { icon: 'fa-circle text-green-400', text: 'Connected' },
            disconnected: { icon: 'fa-circle text-red-400', text: 'Disconnected' },
            locked: { icon: 'fa-lock text-yellow-400', text: 'Wallet Locked' },
            error: { icon: 'fa-exclamation-triangle text-red-400', text: 'Connection Error' },
            'wrong-network': { icon: 'fa-exclamation-triangle text-orange-400', text: 'Wrong Network' }
        };
        
        const config = statusConfig[status] || statusConfig.disconnected;
        statusEl.innerHTML = `<i class="fas ${config.icon} mr-1"></i>${config.text}`;
    }

    setLoading(loading) {
        this.isLoading = loading;
    }

    showLoadingOverlay(message = 'Processing...') {
        const overlay = document.getElementById('loading-overlay');
        overlay.querySelector('span').textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoadingOverlay() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showStatus(message, type = 'info') {
        const statusContainer = document.getElementById('status-messages');
        const statusDiv = document.createElement('div');
        
        const bgColors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        statusDiv.className = `${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 translate-x-0`;
        statusDiv.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;

        statusContainer.appendChild(statusDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            statusDiv.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the dApp when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StellarDApp();
});
