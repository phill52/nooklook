import { Villager } from "../utils.tsx";

export default function VillagerIcon(props: {villager: Villager}) {
  const {villager} = props;
  const isFound = villager.found;
  const iconName = `${isFound ? "Villager Icon" : `${villager.name.toLocaleUpperCase()} Icon`}`;
  return (
    <div className="villager-icon">
      <img src={villager.icon_url} alt={iconName} className={isFound? "" : "unfound"}/>
    </div>
  );
}