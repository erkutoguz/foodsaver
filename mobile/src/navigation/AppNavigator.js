import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { AuthScreen } from "../screens/AuthScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { InventoryScreen } from "../screens/InventoryScreen";
import { LandingScreen } from "../screens/LandingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RecipesScreen } from "../screens/RecipesScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
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
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Recipes" component={RecipesScreen} />
      <Tab.Screen name="More" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = false;

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.paper,
          card: "#ffffff",
          text: colors.ink,
          border: colors.line,
          primary: colors.brand
        }
      }}
    >
      {isAuthenticated ? (
        <MainTabs />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: "#ffffff"
            },
            headerShadowVisible: false,
            headerTintColor: colors.ink,
            headerTitleStyle: {
              color: colors.ink,
              fontWeight: "700"
            },
            headerBackTitleVisible: false,
            contentStyle: {
              backgroundColor: colors.paper
            }
          }}
        >
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={({ route }) => ({
              title: route.params?.mode === "register" ? "Create Account" : "Sign In"
            })}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
