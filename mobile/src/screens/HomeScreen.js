import { StyleSheet} from "react-native";
import { ScreenShell } from "../components/ScreenShell";
import { colors } from "../theme/colors";

export function HomeScreen() {
  return (
    <ScreenShell
     
    >
     
      

     
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8
  },
  item: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  }
});
