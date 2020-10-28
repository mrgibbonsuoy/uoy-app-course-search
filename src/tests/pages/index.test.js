import { render, screen } from "@testing-library/react";
import App, { getServerSideProps } from "../../pages";

beforeEach(() => {
    fetch.resetMocks();
});

const emptyContext = { query: {} };
const contextWithSearchTerm = { query: { search: "english" } };

describe("App", () => {
    it("displays an appropriate page heading", () => {
        render(<App />);

        expect(screen.getByRole("heading", { name: "Courses" })).toBeInTheDocument();
    });

    it("displays the search element", () => {
        render(<App />);

        expect(screen.getByRole("search", { name: "Courses" })).toBeVisible();
    });

    it("displays the titles from course search results", () => {
        const searchResults = [
            { title: "Maths", liveUrl: "http://foo.bar" },
            { title: "Physics", liveUrl: "http://foo.baz" },
        ];

        render(<App isSuccessfulSearch searchResults={searchResults} />);

        expect(screen.getByRole("link", { name: "Maths" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Physics" })).toBeInTheDocument();
    });
});

describe("getServerSideProps", () => {
    it("calls the Courses API and returns response in expected format", async () => {
        fetch.mockResponse(
            JSON.stringify({
                numberOfMatches: 1,
                results: [
                    {
                        title: "English",
                    },
                ],
            })
        );

        const response = await getServerSideProps(contextWithSearchTerm);

        expect(fetch).toHaveBeenCalledTimes(1);

        expect(response.props.isSuccessfulSearch).toEqual(true);
        expect(response.props.searchResults.results).toEqual([{ title: "English" }]);
        expect(response.props.searchTerm).toEqual("english");
    });

    it("calls the Courses API with the correct base url", async () => {
        await getServerSideProps(emptyContext);

        expect(fetch).toHaveBeenCalledTimes(1);

        const calledUrl = fetch.mock.calls[0][0];
        expect(calledUrl).toContain("https://test.courses.api.com");
    });

    it("calls the Courses API with a default search term when none is entered", async () => {
        await getServerSideProps(emptyContext);

        expect(fetch).toHaveBeenCalledTimes(1);

        const calledUrl = fetch.mock.calls[0][0];
        expect(calledUrl).toContain("search=maths");
    });

    it("calls the Courses API with a search term", async () => {
        await getServerSideProps(contextWithSearchTerm);

        expect(fetch).toHaveBeenCalledTimes(1);

        const calledUrl = fetch.mock.calls[0][0];
        expect(calledUrl).toContain("search=english");
    });

    it("calls the Courses API with a maximum number of results to return", async () => {
        await getServerSideProps(contextWithSearchTerm);

        expect(fetch).toHaveBeenCalledTimes(1);

        const calledUrl = fetch.mock.calls[0][0];
        expect(calledUrl).toContain("max=20");
    });

    it("indicates when the Courses API search failed (http error response)", async () => {
        fetch.mockResponse("{}", { status: 500 });

        const response = await getServerSideProps(emptyContext);

        expect(response.props.isSuccessfulSearch).toEqual(false);
        expect(response.props.searchResults.results).toEqual([]);
        expect(response.props.searchResults.numberOfMatches).toEqual(0);
    });

    it("indicates when the Courses API search failed (network or other error)", async () => {
        fetch.mockReject(new Error("can not resolve host"));

        const response = await getServerSideProps(emptyContext);

        expect(response.props.isSuccessfulSearch).toEqual(false);
        expect(response.props.searchResults.numberOfMatches).toEqual(0);
        expect(response.props.searchResults.results).toEqual([]);
    });

    it("returns the number of matches from the API", async () => {
        fetch.mockResponse(
            JSON.stringify({
                numberOfMatches: 1,
                results: [],
            })
        );

        const response = await getServerSideProps(contextWithSearchTerm);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(response.props.isSuccessfulSearch).toEqual(true);
        expect(response.props.searchResults.numberOfMatches).toEqual(1);
    });
});
