function HomeStackDriver({ setIsAuthenticated }) {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="DeliveryList" component={DeliveryListScreen} />
      <HomeStack.Screen name="DeliveryForm" component={DeliveryFormScreen} />
      <HomeStack.Screen name="NotificationList" component={NotificationListScreen} />
      <HomeStack.Screen name="SalaryList" component={SalaryListScreen} />
      <HomeStack.Screen name="SalaryDetail" component={SalaryDetailScreen} />
      <HomeStack.Screen name="ActionLog" component={ActionLogScreen} />
      <HomeStack.Screen name="ProfileScreen">
        {props => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

export default function MainTabsDriver({ setIsAuthenticated }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Accueil">
        {(props) => <HomeStackDriver {...props} setIsAuthenticated={setIsAuthenticated} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
