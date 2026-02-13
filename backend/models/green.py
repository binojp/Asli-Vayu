import osmnx as ox
import networkx as nx

def green_route(start, end, pollution_grid):
    G = ox.graph_from_point(start, dist=5000, network_type="drive")

    for u, v, k, data in G.edges(keys=True, data=True):
        data["weight"] = data["length"] * pollution_factor(u, v, pollution_grid)

    route = nx.shortest_path(
        G,
        ox.distance.nearest_nodes(G, start[1], start[0]),
        ox.distance.nearest_nodes(G, end[1], end[0]),
        weight="weight"
    )

    return ox.utils_graph.route_to_gdf(G, route)
