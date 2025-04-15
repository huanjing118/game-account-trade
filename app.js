const firebaseConfig = {
  apiKey: "AIzaSyAUIqrgmYdzcXrYaVqy3Pt6Q1-T97oeV-k",
  authDomain: "game-account-trade.firebaseapp.com",
  projectId: "game-account-trade",
  storageBucket: "game-account-trade.firebasestorage.app",
  messagingSenderId: "72288630382",
  appId: "1:72288630382:web:ec872878163c8d9d5b187f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 页面切换函数
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active-page');
    });
    document.getElementById(pageId + '-page').classList.add('active-page');
    
    // 根据页面加载特定内容
    switch(pageId) {
        case 'market':
            loadAccounts();
            break;
        case 'recharge':
            loadBalance();
            loadRechargeHistory();
            break;
        case 'support':
            loadSupportHistory();
            break;
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 登录/注册标签切换
    document.getElementById('login-tab').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        this.classList.add('active');
        document.getElementById('register-tab').classList.remove('active');
    });
    
    document.getElementById('register-tab').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        this.classList.add('active');
        document.getElementById('login-tab').classList.remove('active');
    });

    // 导航链接点击事件
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        auth.signOut().then(() => {
            document.getElementById('main-nav').style.display = 'none';
            document.getElementById('auth-page').classList.add('active-page');
        });
    });

    // 登录表单提交
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // 登录成功后显示主界面
                document.getElementById('auth-page').classList.remove('active-page');
                document.getElementById('main-nav').style.display = 'flex';
                document.getElementById('username-display').textContent = userCredential.user.email;
                showPage('market');
            })
            .catch((error) => {
                alert('登录失败: ' + error.message);
            });
    });

    // 注册表单提交
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const username = document.getElementById('register-username').value;
        
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // 创建用户文档
                return db.collection('users').doc(userCredential.user.uid).set({
                    username: username,
                    email: email,
                    balance: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                alert('注册成功！请登录');
                document.getElementById('login-tab').click();
                document.getElementById('register-form').reset();
            })
            .catch((error) => {
                alert('注册失败: ' + error.message);
            });
    });

    // 出售账号按钮
    document.getElementById('sell-account-btn').addEventListener('click', function() {
        const sellModal = new bootstrap.Modal(document.getElementById('sellModal'));
        sellModal.show();
    });

    // 提交出售表单
    document.getElementById('submit-sell').addEventListener('click', function() {
        const game = document.getElementById('sell-game').value;
        const server = document.getElementById('sell-server').value;
        const description = document.getElementById('sell-description').value;
        const price = parseFloat(document.getElementById('sell-price').value);
        const contact = document.getElementById('sell-contact').value;
        
        if (!game || !description || !price || !contact) {
            alert('请填写所有必填字段');
            return;
        }
        
        const user = auth.currentUser;
        if (!user) {
            alert('请先登录');
            return;
        }
        
        db.collection('accounts').add({
            game: game,
            server: server,
            description: description,
            price: price,
            contact: contact,
            sellerId: user.uid,
            sellerEmail: user.email,
            status: 'available',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert('账号出售信息已提交！');
            document.getElementById('sell-form').reset();
            bootstrap.Modal.getInstance(document.getElementById('sellModal')).hide();
            loadAccounts();
        })
        .catch(error => {
            alert('提交失败: ' + error.message);
        });
    });

    // 充值选项点击
    document.querySelectorAll('.recharge-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseFloat(this.getAttribute('data-amount'));
            initiateRecharge(amount);
        });
    });

    // 自定义充值
    document.getElementById('custom-recharge-btn').addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('custom-amount').value);
        if (isNaN(amount) || amount <= 0) {
            alert('请输入有效的充值金额');
            return;
        }
        initiateRecharge(amount);
    });

    // 客服表单提交
    document.getElementById('support-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('support-type').value;
        const content = document.getElementById('support-content').value;
        
        const user = auth.currentUser;
        if (!user) {
            alert('请先登录');
            return;
        }
        
        db.collection('supportTickets').add({
            userId: user.uid,
            userEmail: user.email,
            type: type,
            content: content,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert('问题已提交，客服会尽快处理！');
            document.getElementById('support-form').reset();
            loadSupportHistory();
        })
        .catch(error => {
            alert('提交失败: ' + error.message);
        });
    });

    // 监听用户状态变化
    auth.onAuthStateChanged(user => {
        if (user) {
            // 用户已登录
            document.getElementById('auth-page').classList.remove('active-page');
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('username-display').textContent = user.email;
            showPage('market');
        } else {
            // 用户未登录
            document.getElementById('main-nav').style.display = 'none';
            document.getElementById('auth-page').classList.add('active-page');
        }
    });
});

// 加载账号列表
function loadAccounts() {
    db.collection('accounts')
        .where('status', '==', 'available')
        .orderBy('createdAt', 'desc')
        .get()
        .then(querySnapshot => {
            const accountList = document.getElementById('account-list');
            accountList.innerHTML = '';
            
            if (querySnapshot.empty) {
                accountList.innerHTML = '<div class="col-12"><div class="alert alert-info">暂无账号出售</div></div>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const account = doc.data();
                const accountCard = document.createElement('div');
                accountCard.className = 'col-md-4 mb-4';
                accountCard.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${account.game}${account.server ? ' - ' + account.server : ''}</h5>
                            <h6 class="text-success">¥${account.price.toFixed(2)}</h6>
                            <p class="card-text">${account.description}</p>
                            <p class="text-muted small">卖家: ${account.sellerEmail}</p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-sm btn-primary buy-btn" data-id="${doc.id}">购买</button>
                        </div>
                    </div>
                `;
                accountList.appendChild(accountCard);
            });
            
            // 添加购买按钮事件
            document.querySelectorAll('.buy-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const accountId = this.getAttribute('data-id');
                    buyAccount(accountId);
                });
            });
        })
        .catch(error => {
            console.error('加载账号失败: ', error);
            document.getElementById('account-list').innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">加载失败，请刷新重试</div>
                </div>
            `;
        });
}

// 购买账号
function buyAccount(accountId) {
    const user = auth.currentUser;
    if (!user) {
        alert('请先登录');
        return;
    }
    
    db.collection('accounts').doc(accountId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('账号不存在');
            }
            
            const account = doc.data();
            if (account.sellerId === user.uid) {
                throw new Error('不能购买自己的账号');
            }
            
            return db.runTransaction(async transaction => {
                // 检查买家余额
                const buyerRef = db.collection('users').doc(user.uid);
                const buyerDoc = await transaction.get(buyerRef);
                if (!buyerDoc.exists) {
                    throw new Error('用户数据不存在');
                }
                
                const buyerData = buyerDoc.data();
                if (buyerData.balance < account.price) {
                    throw new Error('余额不足，请先充值');
                }
                
                // 扣除买家余额
                transaction.update(buyerRef, {
                    balance: buyerData.balance - account.price
                });
                
                // 增加卖家余额
                const sellerRef = db.collection('users').doc(account.sellerId);
                const sellerDoc = await transaction.get(sellerRef);
                if (sellerDoc.exists) {
                    const sellerData = sellerDoc.data();
                    transaction.update(sellerRef, {
                        balance: sellerData.balance + account.price
                    });
                }
                
                // 更新账号状态
                transaction.update(db.collection('accounts').doc(accountId), {
                    status: 'sold',
                    buyerId: user.uid,
                    buyerEmail: user.email,
                    soldAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // 创建交易记录
                transaction.set(db.collection('transactions').doc(), {
                    accountId: accountId,
                    game: account.game,
                    price: account.price,
                    sellerId: account.sellerId,
                    sellerEmail: account.sellerEmail,
                    buyerId: user.uid,
                    buyerEmail: user.email,
                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return '购买成功！';
            });
        })
        .then(message => {
            alert(message);
            loadAccounts();
            loadBalance();
        })
        .catch(error => {
            alert('购买失败: ' + error.message);
        });
}

// 加载用户余额
function loadBalance() {
    const user = auth.currentUser;
    if (!user) return;
    
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('balance-amount').textContent = userData.balance.toFixed(2);
            }
        })
        .catch(error => {
            console.error('加载余额失败: ', error);
        });
}

// 初始化充值
function initiateRecharge(amount) {
    const user = auth.currentUser;
    if (!user) {
        alert('请先登录');
        return;
    }
    
    // 在实际应用中，这里应该跳转到支付网关
    // 这里我们模拟一个成功的充值
    
    db.collection('recharges').add({
        userId: user.uid,
        amount: amount,
        status: 'completed',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // 更新用户余额
        return db.collection('users').doc(user.uid).update({
            balance: firebase.firestore.FieldValue.increment(amount)
        });
    })
    .then(() => {
        alert(`成功充值 ¥${amount.toFixed(2)}`);
        loadBalance();
        loadRechargeHistory();
    })
    .catch(error => {
        alert('充值失败: ' + error.message);
    });
}

// 加载充值记录
function loadRechargeHistory() {
    const user = auth.currentUser;
    if (!user) return;
    
    db.collection('recharges')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
        .then(querySnapshot => {
            const historyTable = document.getElementById('recharge-history');
            historyTable.innerHTML = '';
            
            if (querySnapshot.empty) {
                historyTable.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center">暂无充值记录</td>
                    </tr>
                `;
                return;
            }
            
            querySnapshot.forEach(doc => {
                const recharge = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${recharge.createdAt?.toDate().toLocaleString() || '未知时间'}</td>
                    <td class="text-success">+¥${recharge.amount.toFixed(2)}</td>
                    <td><span class="badge bg-success">${recharge.status}</span></td>
                `;
                historyTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error('加载充值记录失败: ', error);
        });
}

// 加载客服历史记录
function loadSupportHistory() {
    const user = auth.currentUser;
    if (!user) return;
    
    db.collection('supportTickets')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
        .then(querySnapshot => {
            const historyContainer = document.querySelector('#support-history .list-group');
            historyContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                historyContainer.innerHTML = `
                    <div class="list-group-item">
                        <div class="text-center text-muted">暂无历史咨询</div>
                    </div>
                `;
                return;
            }
            
            querySnapshot.forEach(doc => {
                const ticket = doc.data();
                const ticketItem = document.createElement('a');
                ticketItem.href = '#';
                ticketItem.className = 'list-group-item list-group-item-action';
                ticketItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${getSupportTypeName(ticket.type)}</h6>
                        <small>${ticket.createdAt?.toDate().toLocaleString() || '未知时间'}</small>
                    </div>
                    <p class="mb-1">${ticket.content}</p>
                    <small class="text-muted">状态: <span class="badge ${getStatusBadgeClass(ticket.status)}">${ticket.status}</span></small>
                `;
                historyContainer.appendChild(ticketItem);
            });
        })
        .catch(error => {
            console.error('加载客服记录失败: ', error);
        });
}

// 辅助函数：获取问题类型名称
function getSupportTypeName(type) {
    const types = {
        'account': '账号问题',
        'trade': '交易问题',
        'payment': '支付问题',
        'other': '其他问题'
    };
    return types[type] || type;
}

// 辅助函数：获取状态标签类
function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-warning',
        'resolved': 'bg-success',
        'rejected': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
}
