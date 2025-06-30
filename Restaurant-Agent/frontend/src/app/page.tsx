"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function Home() {
  const dummyNotifications = [
    { id: 1, text: "Order ORD-001 was updated by kitchen. Please review the changes.", time: "2h ago", unread: true },
    { id: 2, text: "New order received from customer. Pending kitchen preparation.", time: "5h ago", unread: true },
    { id: 3, text: "Daily sales report is ready. Please review the report.", time: "1d ago", unread: false },
  ];
  const dummyOrders = [
    { id: 1, name: "ORD-001", status: "Preparing", priority: "High", date: "2024-01-01" },
    { id: 2, name: "ORD-002", status: "Ready", priority: "Medium", date: "2024-01-02" },
    { id: 3, name: "ORD-003", status: "Delivered", priority: "Low", date: "2024-01-03" },
    { id: 4, name: "ORD-004", status: "Preparing", priority: "High", date: "2024-01-04" },
  ];
  const dummyStatus = [
    { id: 1, name: "Preparing", value: 25, color: "#FFA726" },
    { id: 2, name: "Ready", value: 45, color: "#66BB6A" },
    { id: 3, name: "Delivered", value: 15, color: "#EF5350" },
    { id: 4, name: "In Kitchen", value: 10, color: "#42A5F5" },
    { id: 5, name: "On Hold", value: 5, color: "#AB47BC" }
  ]
  const dummyWorkflow = [
    { id: 1, title: "Total Orders", value: 120, trend: "up", trendValue: 15 },
    { id: 2, title: "Average Prep Time", value: "15 min", trend: "down", trendValue: 2 },
    { id: 3, title: "Order Completion Rate", value: "95%", trend: "up", trendValue: 3 },
    { id: 4, title: "Daily Orders", value: 45, trend: "up", trendValue: 12 },
    { id: 5, title: "Weekly Orders", value: 280, trend: "up", trendValue: 18 },
    { id: 6, title: "Monthly Orders", value: 1200, trend: "up", trendValue: 22 },
  ];

  const dummyDeliveryOrders = [
    { id: 1, name: "ORD-001", status: "In Transit", priority: "High", date: "2024-01-01", driver: "John Mwangi", location: "Westlands, Nairobi", estimatedTime: "25 min", items: ["Kung Pao Chicken", "Fried Rice"], totalPrice: 2500 },
    { id: 2, name: "ORD-002", status: "Picked Up", priority: "Medium", date: "2024-01-02", driver: "Sarah Kimani", location: "Kilimani, Nairobi", estimatedTime: "18 min", items: ["Sweet & Sour Pork", "Noodles"], totalPrice: 1800 },
    { id: 3, name: "ORD-003", status: "Delivered", priority: "Low", date: "2024-01-03", driver: "Mike Ochieng", location: "Lavington, Nairobi", estimatedTime: "0 min", items: ["Beef Stir Fry", "Spring Rolls"], totalPrice: 3200 },
    { id: 4, name: "ORD-004", status: "Preparing", priority: "High", date: "2024-01-04", driver: "Alice Wanjiku", location: "Karen, Nairobi", estimatedTime: "35 min", items: ["Dim Sum Set", "Hot & Sour Soup"], totalPrice: 4200 },
  ];

  const dummyAnalyticsChart = [{ monday: 45, tuesday: 52, wednesday: 48, thursday: 58, friday: 65, saturday: 72, sunday: 68 }]

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatSessionId, setChatSessionId] = useState("");

  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "Hi! How can I help you with your restaurant orders today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);

  useEffect(() => {
    setChatSessionId(Math.random().toString(36).substring(2, 15));
  }, []);

  function handleChatSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(msgs => [...msgs, { from: "user", text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    const ws = new WebSocket(`ws://localhost:4000/ws/chat/${chatSessionId}`);
    console.log(ws);
    ws.onopen = () => {
      console.log("open");
      ws.send(JSON.stringify({ message: chatInput }));
    };

    ws.onmessage = (event) => {
      console.log("message");
      const data = JSON.parse(event.data);
      setChatMessages(msgs => [...msgs, { 
        from: "bot", 
        text: data.message, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      console.log("message", data.message);
      ws.close();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setChatMessages(msgs => [...msgs, { 
        from: "bot", 
        text: "Sorry, I encountered an error. Please try again.", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      console.log("error", error);
    };
    setChatInput("");
    handleChatOpen();
  }

  useEffect(() => {
    const chatMessages = document.querySelector(`.${styles.chatbotMessages}`);
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, [chatMessages]);

  function handleChatOpen() {
    setChatOpen(true);
  }

  function handleChatClose() {
    setChatOpen(false);
  }

  return (
    <div className={styles.appRoot}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span style={{ color: 'var(--primary-gold)', fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, letterSpacing: '0.04em' }}>Hong China</span>
          <span style={{ color: 'var(--primary-red)', fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, marginLeft: 8 }}>Restaurant</span>
        </div>
        <nav className={styles.navLinks}>
          <a className={styles.active} href="#dashboard">
            <span style={{ color: 'var(--primary-gold)' }}>🏮</span> Dashboard
          </a>
          <a href="#orders">
            <span style={{ color: 'var(--primary-gold)' }}>🥢</span> Orders
          </a>
          <a href="#analytics">
            <span style={{ color: 'var(--primary-gold)' }}>📈</span> Analytics
          </a>
          <a href="#menu">
            <span style={{ color: 'var(--primary-gold)' }}>📋</span> Menu
          </a>
          <a href="#communication">
            <span style={{ color: 'var(--primary-gold)' }}>💬</span> Communication
          </a>
          <a href="#settings">
            <span style={{ color: 'var(--primary-gold)' }}>⚙️</span> Settings
          </a>
        </nav>
      </aside>
      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'var(--primary-gold)', padding: '8px 16px', borderRadius: 12, color: 'var(--primary-red)', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: 18, boxShadow: 'var(--box-shadow)' }}>
              欢迎回来！
            </div>
            <input className={styles.searchBar} type="text" placeholder="Search orders..." aria-label="Global search" />
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.notificationBtn} aria-label="Notifications">🔔</button>
            <div className={styles.profileDropdown}>
              <img className={styles.profilePic} src="https://api.dicebear.com/7.x/avataaars/svg?seed=restaurant" alt="Profile" />
              <span className={styles.profileName}>Manager</span>
            </div>
          </div>
        </header>
        <main className={styles.dashboardContent}>
          <div style={{ background: 'var(--primary-red)', padding: '24px 32px', borderRadius: 16, marginBottom: 24, color: 'var(--primary-gold)', boxShadow: 'var(--box-shadow)', border: '2px solid var(--primary-gold)' }}>
            <h1 style={{ fontSize: 32, margin: 0, marginBottom: 8, fontFamily: 'var(--font-heading)' }}>Welcome to Hong China Restaurant Command Center</h1>
            <p style={{ margin: 0, opacity: 0.95, fontFamily: 'var(--font-body)' }}>Track, manage, and optimize your restaurant operations with elegance and tradition.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <section className={styles.dashboardSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: 'var(--primary-gold)' }}>📈</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>Order Performance</h2>
              </div>
              {
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: '#4f8cff' }}></div>
                      <span style={{ fontSize: 14, color: '#666' }}>Orders Volume</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: '#00b894' }}></div>
                      <span style={{ fontSize: 14, color: '#666' }}>Delivery Rate</span>
                    </div>
                  </div>
                  <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 8px' }}>
                    {dummyAnalyticsChart[0] && Object.entries(dummyAnalyticsChart[0]).map(([day, value]) => (
                      <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', display: 'flex', gap: 2 }}>
                          <div style={{
                            width: '50%',
                            height: `${(value as number) * 0.8}px`,
                            background: '#4f8cff',
                            borderRadius: '4px 4px 0 0'
                          }}></div>
                          <div style={{
                            width: '50%',
                            height: `${(value as number) * 0.6}px`,
                            background: '#00b894',
                            borderRadius: '4px 4px 0 0'
                          }}></div>
                        </div>
                        <span style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              }
            </section>

            {/* Status Overview Section */}
            <section className={styles.dashboardSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: 'var(--primary-gold)' }}>🎯</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>Status Overview</h2>
              </div>
              <div className={styles.statusGrid}>
                {
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: 200, height: 200, position: 'relative' }}>
                      <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        {dummyStatus.map((status, index) => {
                          const total = dummyStatus.reduce((acc, curr) => acc + curr.value, 0);
                          const percentage = (status.value / total) * 100;
                          const startAngle = index === 0 ? 0 :
                            dummyStatus.slice(0, index).reduce((acc, curr) => acc + (curr.value / total) * 360, 0);
                          const endAngle = startAngle + (percentage * 3.6);

                          const x1 = 50 + 40 * Math.cos(startAngle * Math.PI / 180);
                          const y1 = 50 + 40 * Math.sin(startAngle * Math.PI / 180);
                          const x2 = 50 + 40 * Math.cos(endAngle * Math.PI / 180);
                          const y2 = 50 + 40 * Math.sin(endAngle * Math.PI / 180);

                          const largeArcFlag = percentage > 50 ? 1 : 0;

                          return (
                            <path
                              key={status.name}
                              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill={status.color}
                              stroke="white"
                              strokeWidth="1"
                            />
                          );
                        })}
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {dummyStatus.map((status) => (
                        <div key={status.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 2, background: status.color }}></div>
                          <span style={{ fontSize: 14, color: '#666' }}>{status.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              </div>
            </section>

            {/* Claims Management Center */}
            <section className={styles.dashboardSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: 'var(--primary-gold)' }}>📋</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>Active Claims</h2>
              </div>
              <div className={styles.claimsTable}>
                <div className={styles.tableWrapper}>
                  <table className={styles.claimsTable}>
                    <thead>
                      <tr>
                        <th>Claim ID</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dummyOrders.map((order) => (
                        <tr key={order.id} className={styles.tableRow}>
                          <td className={styles.tableCell}>{order.name}</td>
                          <td className={styles.tableCell}>
                            <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className={styles.tableCell}>
                            <span className={`${styles.priorityBadge} ${styles[order.priority.toLowerCase()]}`}>
                              {order.priority}
                            </span>
                          </td>
                          <td className={styles.tableCell}>{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Claims Workflow */}
            <section className={styles.dashboardSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: 'var(--primary-gold)' }}>🔄</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>Workflow Progress</h2>
              </div>
              <div className={styles.workflowGrid}>
                {dummyWorkflow.map((item) => (
                  <div key={item.id} className={styles.workflowCard}>
                    <h3>{item.title}</h3>
                    <div className={styles.workflowValue}>
                      <span className={styles.value}>{item.value}</span>
                      <span className={`${styles.trend} ${styles[item.trend]}`}>
                        {item.trend === 'up' ? '↑' : '↓'} {item.trendValue}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Delivery Orders  */}
            <section className={styles.dashboardSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: 'var(--primary-gold)' }}>🚚</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>Delivery Orders  </h2>
              </div>
              <div className={styles.deliveryOrdersTable}>
                <table className={styles.deliveryTable}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Status</th>
                      <th>Driver</th>
                      <th>Location</th>
                      <th>Est. Time</th>
                      <th>Items</th>
                      <th>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dummyDeliveryOrders.map((order) => (
                      <tr key={order.id} className={styles.deliveryTableRow}>
                        <td className={styles.deliveryTableCell}>{order.name}</td>
                        <td className={styles.deliveryTableCell}>
                          <span className={`${styles.deliveryStatusBadge} ${styles[order.status.toLowerCase().replace(' ', '')]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className={styles.deliveryTableCell}>{order.driver}</td>
                        <td className={styles.deliveryTableCell}>{order.location}</td>
                        <td className={styles.deliveryTableCell}>{order.estimatedTime}</td>
                        <td className={styles.deliveryTableCell}>
                          <div className={styles.orderItems}>
                            {order.items.map((item, index) => (
                              <span key={index} className={styles.orderItem}>{item}</span>
                            ))}
                          </div>
                        </td>
                        <td className={styles.deliveryTableCell}>KSh {order.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/*  Messages Communication */}
            <section className={styles.dashboardSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: 'var(--primary-gold)' }}>💌</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>Messages</h2>
              </div>
              {
                <div className={styles.messagesContainer}>
                  {dummyNotifications.map((notification) => (
                    <div key={notification.id} className={styles.messageItem}>
                      <span className={styles.messageText}>{notification.text}</span>
                      <span className={styles.messageTime}>{notification.time}</span>
                    </div>
                  ))}
                </div>
              }
            </section>
          </div>
        </main>
      </div>
      <div className={styles.chatbotWidget}>
        <div className={styles.chatbotAvatar} onClick={handleChatOpen}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=chef&backgroundColor=ffdfbf&clothesColor=dc2626" alt="Chef Assistant" />
        </div>
        {chatOpen && (
          <div className={styles.chatbotWindow}>
            <div className={styles.chatbotHeader}>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>Hong China Chat <span style={{ fontSize: 12, color: 'var(--primary-gold)' }}>v1.0.0</span></h3>
              <span className={styles.chatbotStatus}>Online</span>
              <div className={styles.poweredBy}>
                <span>powered by</span>
                <img src="/openai-logo.svg" alt="OpenAI"/>
                <span style={{ fontSize: 10, color: 'var(--primary-gold)', verticalAlign: 'sub' }}>OpenAI</span>
              </div>
              <button className={styles.closeChat} onClick={handleChatClose}>✕</button>
            </div>
            <div className={styles.chatbotMessages}>
              {chatMessages.map((message, index) => (
                <div key={index} className={`${styles.message} ${styles[message.from]}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>{message.text}</div>
                    <div className={styles.messageTime}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSend} className={styles.chatbotInput}>
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className={styles.chatInput}
              />
              <button type="submit" className={styles.sendButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
