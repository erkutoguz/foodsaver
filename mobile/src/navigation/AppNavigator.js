import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "../theme/colors";
import { AuthScreen } from "../screens/AuthScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { InventoryScreen } from "../screens/InventoryScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RecipesScreen } from "../screens/RecipesScreen";

const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: "#ffffff",
    text: colors.ink,
    border: colors.line,
    primary: colors.brand
  }
};

export function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#ffffff"
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            color: colors.ink,
            fontWeight: "700"
          },
          tabBarStyle: {
            height: 64,
            paddingBottom: 8,
            paddingTop: 8
          },
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.slate,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "700"
          }
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Auth" component={AuthScreen} />
        <Tab.Screen name="Inventory" component={InventoryScreen} />
        <Tab.Screen name="Recipes" component={RecipesScreen} />
        <Tab.Screen name="More" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
