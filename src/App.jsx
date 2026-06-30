
import './App.css';
import logo from './assets/logo.jpg';
import Recharge from './pages/Recharge';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import Profile from './Profile';
import Register from './Register';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Test1 from './pages/Test1';
import { AuthProvider } from './context/AuthContext';
import Transaction from './pages/Transaction';
import RechargeRecords from './pages/RechargeRecords';
import BankCard from './pages/BankCard';
import AccountSecurity from './pages/AccountSecurity';
import ModifyLoginPassword from './pages/account-security/ModifyLoginPassword';
import ModifyPaymentPassword from './pages/account-security/ModifyPaymentPassword';
import Withdraw from './pages/Withdraw';
import WithdrawalRecords from './pages/WithdrawalRecords';
import Activity from './pages/Activity';
import Promotion from './pages/Promotion';
import ReferredUser from './pages/ReferredUser';
import Home from './pages/Home';
import GiftClaim from './pages/GiftClaim';
import Announcement from './pages/Announcement';
import MinesGame from './pages/MinesGame';
import BettingHistory from './pages/BettingHistory';
import RequireBankCard from './components/RequireBankCard';
import Blackjack from './pages/Blackjack';
import Transfer from './pages/Transfer';
import TransferRecords from './pages/TransferRecords';
import UsdtPayment from './pages/UsdtPayment';
import TrxPayment from './pages/TrxPayment';
import AgencyCenter from './pages/AgencyCenter';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/register/:referralCode?" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/gift/:giftCode" element={<GiftClaim />} />



          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/transactions" element={<Transaction />} />
            <Route path="/bank-card" element={<BankCard />} />
            <Route path="/account-security" element={<AccountSecurity />} />
            <Route path="/modify-login-password" element={<ModifyLoginPassword />} />
            <Route path="/modify-payment-password" element={
              <RequireBankCard>
                <ModifyPaymentPassword />
              </RequireBankCard>
            } />


            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/promotion" element={<Promotion />} />


            <Route path="/withdrawal-records" element={<WithdrawalRecords />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/referred-users" element={<ReferredUser />} />
            <Route path="/gift/:giftCode" element={<GiftClaim />} />

            <Route path="/announcement" element={<Announcement />} />
            <Route path="/mines" element={<MinesGame />} />
            <Route path="/blackjack" element={<Blackjack />} />

            <Route path="/betting-history" element={<BettingHistory />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transfer-records" element={<TransferRecords />} />
            <Route path="/usdt-payment/:orderId" element={<UsdtPayment />} />
            <Route path="/trx-payment/:orderId"  element={<TrxPayment />} />
            <Route path="/agency-center" element={<AgencyCenter />} />













            <Route path="/recharge" element={<Recharge />} />
            <Route path="/" element={<Home />} />

            <Route path="/recharge-records" element={<RechargeRecords />} />


          </Route>


        </Routes>



      </BrowserRouter>
    </AuthProvider>

  );
};


export default App;
