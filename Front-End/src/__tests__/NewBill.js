/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../pages/NewBill/NewBillUI.js"
import { initNewBillPage } from "../pages/NewBill/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered with all required fields", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      // Verify form is present
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()

      // Verify all form fields are present
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
    })

    test("Then the submit button should be rendered", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const submitButton = screen.getByText("Envoyer")
      expect(submitButton).toBeTruthy()
      expect(submitButton.type).toBe("submit")
    })

    test("Then the page title should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })

    test("Then the expense type select should have all options", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const expenseTypeSelect = screen.getByTestId("expense-type")
      expect(expenseTypeSelect).toBeTruthy()

      // Verify all expense type options are present
      expect(screen.getByText("Transports")).toBeTruthy()
      expect(screen.getByText("Restaurants et bars")).toBeTruthy()
      expect(screen.getByText("Hôtel et logement")).toBeTruthy()
      expect(screen.getByText("Services en ligne")).toBeTruthy()
      expect(screen.getByText("IT et électronique")).toBeTruthy()
      expect(screen.getByText("Equipement et matériel")).toBeTruthy()
      expect(screen.getByText("Fournitures de bureau")).toBeTruthy()
    })
  })
})

describe("Given I am connected as an employee", () => {
  describe("When I upload a file with an invalid extension", () => {
    test("Then the file input should be cleared and an error message displayed", () => {
      document.body.innerHTML = NewBillUI()

      const localStorageMock = {
        getItem: jest.fn(() => JSON.stringify({ email: "employee@test.tld" }))
      }

      initNewBillPage({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: localStorageMock
      })

      const fileInput = screen.getByTestId("file")
      const invalidFile = new File(["fake content"], "photo.gif", { type: "image/gif" })

      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile]
      })
      Object.defineProperty(fileInput, 'value', {
        value: "C:\\fakepath\\photo.gif",
        writable: true
      })

      fireEvent.change(fileInput)

      expect(fileInput.value).toBe("")
      const errorMessage = screen.getByTestId("file-error-message")
      expect(errorMessage.style.display).toBe("block")
    })
  })
})

describe("When I upload a file with a valid extension", () => {
  test("Then the file should be sent to the store", async () => {
    document.body.innerHTML = NewBillUI()

    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ email: "employee@test.tld" }))
    }

    const mockCreate = jest.fn().mockResolvedValue({
      fileUrl: "https://test.com/bill.jpg",
      key: "1234"
    })

    const mockStore = {
      bills: () => ({
        create: mockCreate
      })
    }

    initNewBillPage({
      document,
      onNavigate: jest.fn(),
      store: mockStore,
      localStorage: localStorageMock
    })

    const fileInput = screen.getByTestId("file")
    const validFile = new File(["fake content"], "bill.jpg", { type: "image/jpeg" })

    Object.defineProperty(fileInput, 'files', {
      value: [validFile]
    })
    Object.defineProperty(fileInput, 'value', {
      value: "C:\\fakepath\\bill.jpg",
      writable: true
    })

    fireEvent.change(fileInput)

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())

    const errorMessage = screen.queryByTestId("file-error-message")
    if (errorMessage) {
      expect(errorMessage.style.display).not.toBe("block")
    }
  })
})

describe("When I submit the form with valid data", () => {
  test("Then it should update the bill and navigate to Bills page", async () => {
    document.body.innerHTML = NewBillUI()

    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ email: "employee@test.tld" }))
    }

    const mockUpdate = jest.fn().mockResolvedValue({})
    const mockStore = {
      bills: () => ({
        update: mockUpdate
      })
    }

    const onNavigate = jest.fn()

    initNewBillPage({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock
    })

    fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } })
    fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Vol Paris Londres" } })
    fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-04" } })
    fireEvent.change(screen.getByTestId("amount"), { target: { value: "348" } })
    fireEvent.change(screen.getByTestId("vat"), { target: { value: "70" } })
    fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } })
    fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Vol pour la vente" } })

    const form = screen.getByTestId("form-new-bill")
    fireEvent.submit(form)

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
  })
})

describe("When I submit the form and the API returns a 404 error", () => {
  test("Then it should log the error and not navigate", async () => {
    document.body.innerHTML = NewBillUI()

    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ email: "employee@test.tld" }))
    }

    const mockUpdate = jest.fn().mockRejectedValue(new Error("Erreur 404"))
    const mockStore = {
      bills: () => ({
        update: mockUpdate
      })
    }

    const onNavigate = jest.fn()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    initNewBillPage({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock
    })

    fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } })
    fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-04" } })
    fireEvent.change(screen.getByTestId("amount"), { target: { value: "348" } })
    fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } })

    const form = screen.getByTestId("form-new-bill")
    fireEvent.submit(form)

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(onNavigate).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})

describe("When I submit the form and the API returns a 500 error", () => {
  test("Then it should log the error and not navigate", async () => {
    document.body.innerHTML = NewBillUI()

    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ email: "employee@test.tld" }))
    }

    const mockUpdate = jest.fn().mockRejectedValue(new Error("Erreur 500"))
    const mockStore = {
      bills: () => ({
        update: mockUpdate
      })
    }

    const onNavigate = jest.fn()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    initNewBillPage({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock
    })

    fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } })
    fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-04" } })
    fireEvent.change(screen.getByTestId("amount"), { target: { value: "348" } })
    fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } })

    const form = screen.getByTestId("form-new-bill")
    fireEvent.submit(form)

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(onNavigate).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})